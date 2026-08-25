import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import {
  VendorProfile,
  Booking,
  BookingTimeline,
  Payment,
  Role,
  Permission,
  User,
  Category,
  Service,
  AuditLog,
  SlotCapacity,
} from '../models';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
} from '../utils/errors';
import { paymentService } from './payment.service';
import { PaginatedResult } from '../types';

export class AdminService {
  /**
   * M8: Dashboard KPI metrics
   */
  public async getDashboardMetrics() {
    const todayStr = new Date().toISOString().split('T')[0];

    const [
      pendingVendorsCount,
      approvedVendorsCount,
      bookingsTodayCount,
      totalBookingsCount,
      successfulPayments,
      failedPaymentsCount,
    ] = await Promise.all([
      VendorProfile.countDocuments({ status: 'PENDING' }),
      VendorProfile.countDocuments({ status: 'APPROVED' }),
      Booking.countDocuments({ date: todayStr }),
      Booking.countDocuments(),
      Payment.aggregate([
        { $match: { status: 'SUCCESS' } },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
      ]),
      Payment.countDocuments({ status: 'FAILED' }),
    ]);

    const totalRevenue = successfulPayments.length > 0 ? successfulPayments[0].totalRevenue : 0;

    return {
      pendingVendors: pendingVendorsCount,
      approvedVendors: approvedVendorsCount,
      bookingsToday: bookingsTodayCount,
      totalBookings: totalBookingsCount,
      revenueCollectedMinor: totalRevenue,
      revenueCollectedFormatted: `₹${(totalRevenue / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      failedPayments: failedPaymentsCount,
    };
  }

  /**
   * M3: Approve Vendor
   */
  public async approveVendor(vendorId: string, adminUserId: string) {
    const vendor = await VendorProfile.findById(vendorId);
    if (!vendor) throw new NotFoundError('VENDOR_NOT_FOUND', 'Vendor profile not found');

    vendor.status = 'APPROVED';
    vendor.rejectionReason = undefined;
    await vendor.save();

    await AuditLog.create({
      actorUserId: new Types.ObjectId(adminUserId),
      action: 'VENDOR_APPROVED',
      targetType: 'VendorProfile',
      targetId: vendor._id.toString(),
      payload: { businessName: vendor.businessName },
    });

    return { message: 'Vendor approved successfully', vendor };
  }

  /**
   * M3: Reject Vendor with reason
   */
  public async rejectVendor(vendorId: string, reason: string, adminUserId: string) {
    const vendor = await VendorProfile.findById(vendorId);
    if (!vendor) throw new NotFoundError('VENDOR_NOT_FOUND', 'Vendor profile not found');

    vendor.status = 'REJECTED';
    vendor.rejectionReason = reason;
    await vendor.save();

    await AuditLog.create({
      actorUserId: new Types.ObjectId(adminUserId),
      action: 'VENDOR_REJECTED',
      targetType: 'VendorProfile',
      targetId: vendor._id.toString(),
      payload: { businessName: vendor.businessName, reason },
    });

    return { message: 'Vendor rejected', vendor };
  }

  /**
   * List all vendors with status filter
   */
  public async listVendors(status?: string) {
    const filter = status ? { status } : {};
    return VendorProfile.find(filter).populate('userId', 'name email phone').sort({ createdAt: -1 });
  }

  /**
   * M4 STRETCH: Suspend Service
   */
  public async suspendService(serviceId: string, reason: string, adminUserId: string) {
    const service = await Service.findById(serviceId);
    if (!service) throw new NotFoundError('SERVICE_NOT_FOUND', 'Service not found');

    service.status = 'SUSPENDED';
    service.suspensionReason = reason;
    await service.save();

    await AuditLog.create({
      actorUserId: new Types.ObjectId(adminUserId),
      action: 'SERVICE_SUSPENDED',
      targetType: 'Service',
      targetId: service._id.toString(),
      payload: { title: service.title, reason },
    });

    return { message: 'Service suspended successfully', service };
  }

  /**
   * Reactivate suspended service
   */
  public async reactivateService(serviceId: string, adminUserId: string) {
    const service = await Service.findById(serviceId);
    if (!service) throw new NotFoundError('SERVICE_NOT_FOUND', 'Service not found');

    service.status = 'PUBLISHED';
    service.suspensionReason = undefined;
    await service.save();

    await AuditLog.create({
      actorUserId: new Types.ObjectId(adminUserId),
      action: 'SERVICE_REACTIVATED',
      targetType: 'Service',
      targetId: service._id.toString(),
      payload: { title: service.title },
    });

    return { message: 'Service reactivated successfully', service };
  }

  /**
   * M8: Cross-vendor booking list with server-side filters
   */
  public async listAllBookings(params: {
    page?: number;
    limit?: number;
    status?: string;
    vendorId?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<PaginatedResult<any>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 10));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (params.status) filter.status = params.status;
    if (params.vendorId) filter.vendorId = new Types.ObjectId(params.vendorId);
    if (params.customerId) filter.customerId = new Types.ObjectId(params.customerId);

    if (params.startDate || params.endDate) {
      filter.date = {};
      if (params.startDate) filter.date.$gte = params.startDate;
      if (params.endDate) filter.date.$lte = params.endDate;
    }

    if (params.search && params.search.trim()) {
      filter.bookingNumber = new RegExp(params.search.trim(), 'i');
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('customerId', 'name email phone')
        .populate('vendorId', 'businessName contactNumber address')
        .populate('serviceId', 'title')
        .populate('offeringId', 'name durationMinutes price')
        .sort({ createdAt: -1 })
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

  /**
   * M8: Force cancel booking with mandatory reason
   */
  public async forceCancelBooking(bookingId: string, reason: string, adminUserId: string) {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new NotFoundError('BOOKING_NOT_FOUND', 'Booking not found');

    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      throw new BadRequestError('INVALID_STATE', `Cannot force cancel booking in ${booking.status} status`);
    }

    const oldStatus = booking.status;
    booking.status = 'CANCELLED';
    booking.cancellationReason = `Admin Force Cancel: ${reason}`;
    await booking.save();

    // Release slot capacity
    await SlotCapacity.updateOne(
      {
        serviceId: booking.serviceId,
        date: booking.date,
        startTime: booking.startTime,
        bookedCount: { $gt: 0 },
      },
      { $inc: { bookedCount: -1 } }
    );

    // If paid, issue refund
    const payment = await Payment.findOne({ bookingId: booking._id, status: 'SUCCESS' });
    if (payment) {
      await paymentService.refundPayment(
        payment._id.toString(),
        payment.amount,
        `Admin cancellation: ${reason}`
      );
    }

    await BookingTimeline.create({
      bookingId: booking._id,
      fromStatus: oldStatus,
      toStatus: 'CANCELLED',
      changedByUserId: new Types.ObjectId(adminUserId),
      reason: `Force cancelled by Administrator: ${reason}`,
    });

    await AuditLog.create({
      actorUserId: new Types.ObjectId(adminUserId),
      action: 'BOOKING_FORCE_CANCELLED',
      targetType: 'Booking',
      targetId: booking._id.toString(),
      payload: { bookingNumber: booking.bookingNumber, reason },
    });

    return { message: 'Booking force cancelled and refunded', booking };
  }

  /**
   * M2: Create custom role
   */
  public async createRole(data: { name: string; description: string; permissions: string[] }, adminUserId: string) {
    const existing = await Role.findOne({ name: data.name.toUpperCase() });
    if (existing) throw new ConflictError('ROLE_EXISTS', 'A role with this name already exists');

    const role = await Role.create({
      name: data.name.toUpperCase(),
      description: data.description,
      permissions: data.permissions,
      isSystem: false,
    });

    await AuditLog.create({
      actorUserId: new Types.ObjectId(adminUserId),
      action: 'ROLE_CREATED',
      targetType: 'Role',
      targetId: role._id.toString(),
      payload: { name: role.name, permissions: role.permissions },
    });

    return role;
  }

  /**
   * M2: Update role permissions (Instant dynamic revocation)
   */
  public async updateRole(roleId: string, data: { name?: string; description?: string; permissions?: string[] }, adminUserId: string) {
    const role = await Role.findById(roleId);
    if (!role) throw new NotFoundError('ROLE_NOT_FOUND', 'Role not found');

    if (data.name && !role.isSystem) role.name = data.name.toUpperCase();
    if (data.description) role.description = data.description;
    if (data.permissions) role.permissions = data.permissions;

    await role.save();

    await AuditLog.create({
      actorUserId: new Types.ObjectId(adminUserId),
      action: 'ROLE_UPDATED',
      targetType: 'Role',
      targetId: role._id.toString(),
      payload: { name: role.name, permissions: role.permissions },
    });

    return role;
  }

  /**
   * List all roles and available permissions
   */
  public async listRolesAndPermissions() {
    const [roles, permissions] = await Promise.all([
      Role.find().sort({ createdAt: 1 }),
      Permission.find().sort({ resource: 1, action: 1 }),
    ]);

    return { roles, permissions };
  }

  /**
   * Create Sub-Admin and assign role
   */
  public async createSubAdmin(
    data: { email: string; password: string; name: string; phone?: string; roleId: string },
    adminUserId: string
  ) {
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) throw new ConflictError('EMAIL_EXISTS', 'User email already exists');

    const role = await Role.findById(data.roleId);
    if (!role) throw new NotFoundError('ROLE_NOT_FOUND', 'Selected role does not exist');

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await User.create({
      email: data.email.toLowerCase(),
      passwordHash,
      name: data.name,
      phone: data.phone,
      roleId: role._id,
      status: 'ACTIVE',
    });

    await AuditLog.create({
      actorUserId: new Types.ObjectId(adminUserId),
      action: 'SUB_ADMIN_CREATED',
      targetType: 'User',
      targetId: user._id.toString(),
      payload: { email: user.email, role: role.name },
    });

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: role.name,
    };
  }

  /**
   * Category Management (2-level hierarchy)
   */
  public async createCategory(data: { name: string; slug: string; description?: string; parentId?: string | null }) {
    const existing = await Category.findOne({ slug: data.slug });
    if (existing) throw new ConflictError('CATEGORY_EXISTS', 'Category slug already exists');

    const category = await Category.create({
      name: data.name,
      slug: data.slug,
      description: data.description,
      parentId: data.parentId ? new Types.ObjectId(data.parentId) : null,
    });

    return category;
  }

  public async updateCategory(categoryId: string, data: Partial<any>) {
    const category = await Category.findById(categoryId);
    if (!category) throw new NotFoundError('CATEGORY_NOT_FOUND', 'Category not found');

    if (data.name) category.name = data.name;
    if (data.slug) category.slug = data.slug;
    if (data.description !== undefined) category.description = data.description;
    if (data.parentId !== undefined) category.parentId = data.parentId ? new Types.ObjectId(data.parentId) : undefined;
    if (data.isActive !== undefined) category.isActive = data.isActive;

    await category.save();
    return category;
  }

  public async listCategories() {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    // Build 2-level tree
    const rootCategories = categories.filter((c) => !c.parentId);
    const subCategories = categories.filter((c) => c.parentId);

    return rootCategories.map((root) => ({
      ...root.toObject(),
      children: subCategories.filter((sub) => sub.parentId?.toString() === root._id.toString()),
    }));
  }

  /**
   * List Audit Logs
   */
  public async listAuditLogs(limit = 50) {
    return AuditLog.find()
      .populate('actorUserId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

export const adminService = new AdminService();
