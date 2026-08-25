import { Types } from 'mongoose';
import {
  VendorProfile,
  Service,
  Offering,
  AvailabilityRule,
  DateException,
  Booking,
} from '../models';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';
import { AuthenticatedUser } from '../types';

export class VendorService {
  public async getProfile(userId: string) {
    const profile = await VendorProfile.findOne({ userId }).populate('userId', 'name email phone');
    if (!profile) {
      throw new NotFoundError('VENDOR_PROFILE_NOT_FOUND', 'Vendor profile not found');
    }
    return profile;
  }

  public async updateProfile(userId: string, data: Partial<any>) {
    const profile = await VendorProfile.findOne({ userId });
    if (!profile) {
      throw new NotFoundError('VENDOR_PROFILE_NOT_FOUND', 'Vendor profile not found');
    }

    if (data.businessName) profile.businessName = data.businessName;
    if (data.contactNumber) profile.contactNumber = data.contactNumber;
    if (data.address) profile.address = data.address;
    if (data.timezone) profile.timezone = data.timezone;
    if (data.documents) profile.documents = data.documents;

    await profile.save();
    return profile;
  }

  public async listVendorServices(vendorId: string) {
    const services = await Service.find({ vendorId })
      .populate('categoryId', 'name slug')
      .sort({ createdAt: -1 });

    const serviceIds = services.map((s) => s._id);
    const offerings = await Offering.find({ serviceId: { $in: serviceIds } });

    const offeringMap = new Map<string, typeof offerings>();
    offerings.forEach((o) => {
      const key = o.serviceId.toString();
      if (!offeringMap.has(key)) offeringMap.set(key, []);
      offeringMap.get(key)!.push(o);
    });

    return services.map((s) => ({
      ...s.toObject(),
      offerings: offeringMap.get(s._id.toString()) || [],
    }));
  }

  public async createService(
    vendorId: string,
    data: {
      categoryId: string;
      title: string;
      description: string;
      images?: string[];
      status?: 'DRAFT' | 'PUBLISHED';
      freeCancellationWindowHours?: number;
    }
  ) {
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;

    const service = await Service.create({
      vendorId: new Types.ObjectId(vendorId),
      categoryId: new Types.ObjectId(data.categoryId),
      title: data.title,
      slug,
      description: data.description,
      images: data.images || [],
      status: data.status || 'DRAFT',
      freeCancellationWindowHours: data.freeCancellationWindowHours ?? 24,
    });

    return service;
  }

  public async updateService(
    serviceId: string,
    vendorId: string,
    data: {
      categoryId?: string;
      title?: string;
      description?: string;
      images?: string[];
      status?: 'DRAFT' | 'PUBLISHED' | 'SUSPENDED';
      freeCancellationWindowHours?: number;
    }
  ) {
    const service = await Service.findById(serviceId);
    if (!service) {
      throw new NotFoundError('SERVICE_NOT_FOUND', 'Service not found');
    }

    if (service.vendorId.toString() !== vendorId) {
      throw new ForbiddenError('FORBIDDEN', 'You do not own this service');
    }

    // A vendor cannot un-suspend a service that was suspended by Admin
    if (service.status === 'SUSPENDED' && data.status && data.status !== 'SUSPENDED') {
      throw new ForbiddenError('FORBIDDEN', 'Suspended services can only be reactivated by an administrator');
    }

    if (data.categoryId) service.categoryId = new Types.ObjectId(data.categoryId);
    if (data.title) {
      service.title = data.title;
      service.slug =
        data.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;
    }
    if (data.description) service.description = data.description;
    if (data.images) service.images = data.images;
    if (data.status) service.status = data.status;
    if (data.freeCancellationWindowHours !== undefined) {
      service.freeCancellationWindowHours = data.freeCancellationWindowHours;
    }

    await service.save();
    return service;
  }

  public async createOffering(
    serviceId: string,
    vendorId: string,
    data: {
      name: string;
      description?: string;
      durationMinutes: number;
      price: number;
      currency?: string;
      isActive?: boolean;
    }
  ) {
    const service = await Service.findById(serviceId);
    if (!service) throw new NotFoundError('SERVICE_NOT_FOUND', 'Service not found');
    if (service.vendorId.toString() !== vendorId) {
      throw new ForbiddenError('FORBIDDEN', 'You do not own this service');
    }

    const offering = await Offering.create({
      serviceId: service._id,
      name: data.name,
      description: data.description,
      durationMinutes: data.durationMinutes,
      price: data.price,
      currency: data.currency || 'INR',
      isActive: data.isActive !== undefined ? data.isActive : true,
    });

    return offering;
  }

  public async updateOffering(offeringId: string, vendorId: string, data: Partial<any>) {
    const offering = await Offering.findById(offeringId);
    if (!offering) throw new NotFoundError('OFFERING_NOT_FOUND', 'Offering not found');

    const service = await Service.findById(offering.serviceId);
    if (!service || service.vendorId.toString() !== vendorId) {
      throw new ForbiddenError('FORBIDDEN', 'You do not own this offering');
    }

    if (data.name) offering.name = data.name;
    if (data.description !== undefined) offering.description = data.description;
    if (data.durationMinutes) offering.durationMinutes = data.durationMinutes;
    if (data.price !== undefined) offering.price = data.price;
    if (data.currency) offering.currency = data.currency;
    if (data.isActive !== undefined) offering.isActive = data.isActive;

    await offering.save();
    return offering;
  }

  public async setAvailabilityRules(
    serviceId: string,
    vendorId: string,
    rules: { dayOfWeek: number; startTime: string; endTime: string; capacity: number }[]
  ) {
    const service = await Service.findById(serviceId);
    if (!service) throw new NotFoundError('SERVICE_NOT_FOUND', 'Service not found');
    if (service.vendorId.toString() !== vendorId) {
      throw new ForbiddenError('FORBIDDEN', 'You do not own this service');
    }

    // Replace rules atomically for this service
    await AvailabilityRule.deleteMany({ serviceId: service._id });
    const createdRules = await AvailabilityRule.insertMany(
      rules.map((r) => ({
        serviceId: service._id,
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
        capacity: r.capacity || 1,
      }))
    );

    return createdRules;
  }

  public async getAvailabilityRules(serviceId: string) {
    return AvailabilityRule.find({ serviceId }).sort({ dayOfWeek: 1, startTime: 1 });
  }

  public async addDateException(
    serviceId: string,
    vendorId: string,
    data: {
      date: string;
      isClosed: boolean;
      customWindows?: { startTime: string; endTime: string; capacity: number }[];
      reason?: string;
    }
  ) {
    const service = await Service.findById(serviceId);
    if (!service) throw new NotFoundError('SERVICE_NOT_FOUND', 'Service not found');
    if (service.vendorId.toString() !== vendorId) {
      throw new ForbiddenError('FORBIDDEN', 'You do not own this service');
    }

    const exception = await DateException.findOneAndUpdate(
      { serviceId: service._id, date: data.date },
      {
        $set: {
          isClosed: data.isClosed,
          customWindows: data.customWindows || [],
          reason: data.reason,
        },
      },
      { upsert: true, new: true }
    );

    return exception;
  }

  public async removeDateException(serviceId: string, exceptionId: string, vendorId: string) {
    const service = await Service.findById(serviceId);
    if (!service) throw new NotFoundError('SERVICE_NOT_FOUND', 'Service not found');
    if (service.vendorId.toString() !== vendorId) {
      throw new ForbiddenError('FORBIDDEN', 'You do not own this service');
    }

    await DateException.deleteOne({ _id: exceptionId, serviceId: service._id });
    return { message: 'Date exception removed successfully' };
  }

  public async getDateExceptions(serviceId: string) {
    return DateException.find({ serviceId }).sort({ date: 1 });
  }

  public async listVendorBookings(
    vendorId: string,
    params: { status?: string; date?: string; page?: number; limit?: number }
  ) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 10));
    const skip = (page - 1) * limit;

    const filter: any = { vendorId: new Types.ObjectId(vendorId) };
    if (params.status) filter.status = params.status;
    if (params.date) filter.date = params.date;

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('customerId', 'name email phone')
        .populate('serviceId', 'title')
        .populate('offeringId', 'name durationMinutes')
        .sort({ date: -1, startTime: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: bookings,
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
}

export const vendorService = new VendorService();
