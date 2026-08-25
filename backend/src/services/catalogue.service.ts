import { Types } from 'mongoose';
import { Service, Offering, VendorProfile, Category } from '../models';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { AuthenticatedUser, PaginatedResult } from '../types';

export class CatalogueService {
  /**
   * M4: Server-side paginated, searchable, filterable public catalogue
   */
  public async searchServices(params: {
    page?: number;
    limit?: number;
    query?: string;
    categoryId?: string;
    vendorId?: string;
  }): Promise<PaginatedResult<any>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 10));
    const skip = (page - 1) * limit;

    // 1. Only APPROVED vendors' services can be in public catalogue
    const approvedVendors = await VendorProfile.find({ status: 'APPROVED' }).select('_id');
    const approvedVendorIds = approvedVendors.map((v) => v._id);

    const filter: any = {
      vendorId: { $in: approvedVendorIds },
      status: 'PUBLISHED',
    };

    if (params.categoryId) {
      // Find category and its subcategories
      const subcategories = await Category.find({ parentId: new Types.ObjectId(params.categoryId) }).select('_id');
      const allCategoryIds = [new Types.ObjectId(params.categoryId), ...subcategories.map((c) => c._id)];
      filter.categoryId = { $in: allCategoryIds };
    }

    if (params.vendorId) {
      filter.vendorId = new Types.ObjectId(params.vendorId);
    }

    if (params.query && params.query.trim().length > 0) {
      const searchRegex = new RegExp(params.query.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
      ];
    }

    const [services, total] = await Promise.all([
      Service.find(filter)
        .populate('vendorId', 'businessName contactNumber address timezone')
        .populate('categoryId', 'name slug parentId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Service.countDocuments(filter),
    ]);

    // Attach active offerings to each service
    const serviceIds = services.map((s) => s._id);
    const offerings = await Offering.find({ serviceId: { $in: serviceIds }, isActive: true });

    const offeringMap = new Map<string, typeof offerings>();
    offerings.forEach((o) => {
      const key = o.serviceId.toString();
      if (!offeringMap.has(key)) {
        offeringMap.set(key, []);
      }
      offeringMap.get(key)!.push(o);
    });

    const data = services.map((s) => ({
      id: s._id.toString(),
      title: s.title,
      slug: s.slug,
      description: s.description,
      images: s.images,
      status: s.status,
      freeCancellationWindowHours: s.freeCancellationWindowHours,
      category: s.categoryId,
      vendor: s.vendorId,
      offerings: offeringMap.get(s._id.toString()) || [],
      createdAt: s.createdAt,
    }));

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Retrieves single service by ID or Slug with permission/ownership check
   */
  public async getServiceDetails(serviceId: string, user?: AuthenticatedUser) {
    let service = await Service.findById(serviceId)
      .populate('vendorId', 'businessName contactNumber address timezone status')
      .populate('categoryId', 'name slug parentId');

    if (!service) {
      // Try finding by slug
      service = await Service.findOne({ slug: serviceId })
        .populate('vendorId', 'businessName contactNumber address timezone status')
        .populate('categoryId', 'name slug parentId');
    }

    if (!service) {
      throw new NotFoundError('SERVICE_NOT_FOUND', 'Service not found');
    }

    const vendor = service.vendorId as any;

    // Visibility rules:
    // If not PUBLISHED or vendor not APPROVED:
    // Only the owning vendor or an Admin/Super Admin may view
    if (service.status !== 'PUBLISHED' || vendor?.status !== 'APPROVED') {
      if (!user) {
        throw new NotFoundError('SERVICE_NOT_FOUND', 'Service not found');
      }

      const isOwner = user.roleName === 'VENDOR' && user.vendorId === vendor._id.toString();
      const isAdmin = user.roleName === 'SUPER_ADMIN' || user.roleName === 'ADMIN';

      if (!isOwner && !isAdmin) {
        throw new NotFoundError('SERVICE_NOT_FOUND', 'Service not found');
      }
    }

    const offerings = await Offering.find({ serviceId: service._id, isActive: true });

    return {
      id: service._id.toString(),
      title: service.title,
      slug: service.slug,
      description: service.description,
      images: service.images,
      status: service.status,
      suspensionReason: service.suspensionReason,
      freeCancellationWindowHours: service.freeCancellationWindowHours,
      category: service.categoryId,
      vendor: service.vendorId,
      offerings,
      createdAt: service.createdAt,
    };
  }
}

export const catalogueService = new CatalogueService();
