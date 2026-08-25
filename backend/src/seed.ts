import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from './config';
import { connectToDatabase } from './db';
import {
  Permission,
  Role,
  User,
  VendorProfile,
  Category,
  Service,
  Offering,
  AvailabilityRule,
  DateException,
  Booking,
  BookingTimeline,
  Payment,
  SlotCapacity,
  AuditLog,
} from './models';

export const PERMISSION_SLUGS = [
  // Authentication & Profile
  { slug: 'auth.me', resource: 'auth', action: 'me', description: 'Read current user profile' },
  
  // Services
  { slug: 'service.create', resource: 'service', action: 'create', description: 'Create and list own services' },
  { slug: 'service.update', resource: 'service', action: 'update', description: 'Update own services' },
  { slug: 'service.delete', resource: 'service', action: 'delete', description: 'Delete own services' },
  { slug: 'service.suspend', resource: 'service', action: 'suspend', description: 'Suspend or reactivate live services' },
  { slug: 'service.view_draft', resource: 'service', action: 'view_draft', description: 'View unpublished draft services' },
  
  // Availability
  { slug: 'availability.manage', resource: 'availability', action: 'manage', description: 'Manage weekly rules and date exceptions' },
  
  // Bookings
  { slug: 'booking.create', resource: 'booking', action: 'create', description: 'Create service bookings' },
  { slug: 'booking.view', resource: 'booking', action: 'view', description: 'View own bookings' },
  { slug: 'booking.view_all', resource: 'booking', action: 'view_all', description: 'View all cross-vendor bookings' },
  { slug: 'booking.cancel', resource: 'booking', action: 'cancel', description: 'Cancel own bookings' },
  { slug: 'booking.reschedule', resource: 'booking', action: 'reschedule', description: 'Reschedule own bookings' },
  { slug: 'booking.confirm', resource: 'booking', action: 'confirm', description: 'Confirm incoming bookings' },
  { slug: 'booking.reject', resource: 'booking', action: 'reject', description: 'Reject incoming bookings' },
  { slug: 'booking.complete', resource: 'booking', action: 'complete', description: 'Mark service as completed' },
  { slug: 'booking.no_show', resource: 'booking', action: 'no_show', description: 'Mark customer as no-show' },
  { slug: 'booking.force_cancel', resource: 'booking', action: 'force_cancel', description: 'Force cancel any booking with reason' },

  // Payments
  { slug: 'payment.collect', resource: 'payment', action: 'collect', description: 'Mark cash / offline payment collected' },
  { slug: 'payment.refund', resource: 'payment', action: 'refund', description: 'Issue refunds' },

  // Vendors
  { slug: 'vendor.approve', resource: 'vendor', action: 'approve', description: 'Approve vendor applications' },
  { slug: 'vendor.reject', resource: 'vendor', action: 'reject', description: 'Reject vendor applications' },

  // Admin & RBAC
  { slug: 'admin.dashboard', resource: 'admin', action: 'dashboard', description: 'View admin metrics dashboard' },
  { slug: 'category.manage', resource: 'category', action: 'manage', description: 'Create and update catalogue categories' },
  { slug: 'role.view', resource: 'role', action: 'view', description: 'View roles and permissions' },
  { slug: 'role.create', resource: 'role', action: 'create', description: 'Create custom roles' },
  { slug: 'role.update', resource: 'role', action: 'update', description: 'Update role permissions' },
  { slug: 'role.assign', resource: 'role', action: 'assign', description: 'Assign roles and create sub-admins' },
  { slug: 'audit.view', resource: 'audit', action: 'view', description: 'View administrative audit logs' },
];

export async function seedDatabase(exitOnComplete = true) {
  try {
    await connectToDatabase();
    console.log(`[Seed] Database connected. Clearing existing data...`);

    // Clean existing collections
    await Promise.all([
      Permission.deleteMany({}),
      Role.deleteMany({}),
      User.deleteMany({}),
      VendorProfile.deleteMany({}),
      Category.deleteMany({}),
      Service.deleteMany({}),
      Offering.deleteMany({}),
      AvailabilityRule.deleteMany({}),
      DateException.deleteMany({}),
      SlotCapacity.deleteMany({}),
      Booking.deleteMany({}),
      BookingTimeline.deleteMany({}),
      Payment.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    console.log(`[Seed] Seeding Permissions...`);
    await Permission.insertMany(PERMISSION_SLUGS);

    const allSlugs = PERMISSION_SLUGS.map((p) => p.slug);

    console.log(`[Seed] Seeding Roles...`);
    // 1. SUPER_ADMIN
    const superAdminRole = await Role.create({
      name: 'SUPER_ADMIN',
      description: 'Super Administrator with unrestricted access to the entire platform',
      permissions: allSlugs,
      isSystem: true,
    });

    // 2. ADMIN
    const adminRole = await Role.create({
      name: 'ADMIN',
      description: 'Administrator with full operational permissions',
      permissions: allSlugs,
      isSystem: true,
    });

    // 3. CATALOGUE_MODERATOR (Custom restricted sub-admin role from rubric)
    const catalogueModeratorRole = await Role.create({
      name: 'CATALOGUE_MODERATOR',
      description: 'Sub-admin restricted exclusively to managing categories and moderating services',
      permissions: [
        'auth.me',
        'admin.dashboard',
        'category.manage',
        'service.suspend',
        'service.view_draft',
        'booking.view_all',
        'audit.view',
      ],
      isSystem: false,
    });

    // 4. VENDOR
    const vendorRole = await Role.create({
      name: 'VENDOR',
      description: 'Service Vendor capable of managing own services, offerings, availability, and bookings',
      permissions: [
        'auth.me',
        'service.create',
        'service.update',
        'service.delete',
        'availability.manage',
        'booking.view',
        'booking.confirm',
        'booking.reject',
        'booking.complete',
        'booking.no_show',
        'payment.collect',
      ],
      isSystem: true,
    });

    // 5. CUSTOMER
    const customerRole = await Role.create({
      name: 'CUSTOMER',
      description: 'End-user customer capable of booking services, paying, rescheduling, and cancelling',
      permissions: [
        'auth.me',
        'booking.create',
        'booking.view',
        'booking.cancel',
        'booking.reschedule',
      ],
      isSystem: true,
    });

    console.log(`[Seed] Seeding Users and Personas...`);
    const defaultPassword = await bcrypt.hash('Password123!', 10);

    // Persona 1: Super Admin
    const superAdmin = await User.create({
      email: 'superadmin@marketplace.com',
      passwordHash: defaultPassword,
      name: 'Sarah SuperAdmin',
      phone: '+91 9900112233',
      roleId: superAdminRole._id,
      status: 'ACTIVE',
    });

    // Persona 2: Catalogue Moderator (Restricted Sub-Admin)
    const moderator = await User.create({
      email: 'moderator@marketplace.com',
      passwordHash: defaultPassword,
      name: 'Mike Moderator',
      phone: '+91 9900112244',
      roleId: catalogueModeratorRole._id,
      status: 'ACTIVE',
    });

    // Persona 3: Approved Vendor
    const vendorApprovedUser = await User.create({
      email: 'vendor.approved@marketplace.com',
      passwordHash: defaultPassword,
      name: 'Elena Rostova',
      phone: '+91 9876543201',
      roleId: vendorRole._id,
      status: 'ACTIVE',
    });

    const approvedProfile = await VendorProfile.create({
      userId: vendorApprovedUser._id,
      businessName: 'Luxe Salon & Wellness Spa',
      contactNumber: '+91 9876543201',
      address: '42 Indiranagar 100ft Road, Bangalore, Karnataka 560038',
      timezone: 'Asia/Kolkata',
      documents: [
        { filename: 'trade_license.pdf', url: 'https://example.com/docs/trade_license.pdf', type: 'LICENSE' },
        { filename: 'gst_certificate.pdf', url: 'https://example.com/docs/gst_certificate.pdf', type: 'TAX' },
      ],
      status: 'APPROVED',
    });

    // Persona 4: Pending Vendor
    const vendorPendingUser = await User.create({
      email: 'vendor.pending@marketplace.com',
      passwordHash: defaultPassword,
      name: 'Rajesh Kumar',
      phone: '+91 9876543202',
      roleId: vendorRole._id,
      status: 'ACTIVE',
    });

    await VendorProfile.create({
      userId: vendorPendingUser._id,
      businessName: 'QuickFix Appliance Repair',
      contactNumber: '+91 9876543202',
      address: '15 Koramangala 5th Block, Bangalore',
      timezone: 'Asia/Kolkata',
      documents: [
        { filename: 'electrician_cert.pdf', url: 'https://example.com/docs/cert.pdf', type: 'CERTIFICATE' },
      ],
      status: 'PENDING',
    });

    // Persona 5: Rejected Vendor
    const vendorRejectedUser = await User.create({
      email: 'vendor.rejected@marketplace.com',
      passwordHash: defaultPassword,
      name: 'Vikram Singh',
      phone: '+91 9876543203',
      roleId: vendorRole._id,
      status: 'ACTIVE',
    });

    await VendorProfile.create({
      userId: vendorRejectedUser._id,
      businessName: 'Speedy Cleaners',
      contactNumber: '+91 9876543203',
      address: '77 HSR Layout Sector 2, Bangalore',
      timezone: 'Asia/Kolkata',
      documents: [],
      status: 'REJECTED',
      rejectionReason: 'Invalid government business registration document and unverifiable physical address.',
    });

    // Persona 6: Customer 1 (Active customer with existing bookings)
    const customer1 = await User.create({
      email: 'customer1@marketplace.com',
      passwordHash: defaultPassword,
      name: 'Priya Sharma',
      phone: '+91 9123456780',
      roleId: customerRole._id,
      status: 'ACTIVE',
    });

    // Persona 7: Customer 2 (Clean new customer)
    const customer2 = await User.create({
      email: 'customer2@marketplace.com',
      passwordHash: defaultPassword,
      name: 'Ananya Roy',
      phone: '+91 9123456781',
      roleId: customerRole._id,
      status: 'ACTIVE',
    });

    console.log(`[Seed] Seeding 2-Level Categories...`);
    // Level 1: Beauty & Wellness
    const catBeauty = await Category.create({
      name: 'Beauty & Wellness',
      slug: 'beauty-wellness',
      description: 'Hair, skin, spa, and personal grooming services',
      parentId: null,
      isActive: true,
    });

    // Level 2 Subcategories
    const catHair = await Category.create({
      name: 'Hair Styling & Cuts',
      slug: 'hair-styling-cuts',
      description: 'Professional haircuts, styling, and coloring',
      parentId: catBeauty._id,
      isActive: true,
    });

    const catSpa = await Category.create({
      name: 'Spa & Massages',
      slug: 'spa-massages',
      description: 'Therapeutic and relaxation massages',
      parentId: catBeauty._id,
      isActive: true,
    });

    // Level 1: Home Services
    const catHome = await Category.create({
      name: 'Home Services',
      slug: 'home-services',
      description: 'Deep cleaning, repair, and plumbing',
      parentId: null,
      isActive: true,
    });

    const catCleaning = await Category.create({
      name: 'Deep Cleaning',
      slug: 'deep-cleaning',
      description: 'Full home and kitchen sanitization',
      parentId: catHome._id,
      isActive: true,
    });

    console.log(`[Seed] Seeding Services & Offerings for Approved Vendor...`);
    // Service 1: Premium Hair Styling & Treatment
    const serviceHair = await Service.create({
      vendorId: approvedProfile._id,
      categoryId: catHair._id,
      title: 'Artisan Haircuts & Colouring Studio',
      slug: 'artisan-haircuts-colouring-studio',
      description:
        'Indulge in personalized hair styling, precision cuts, and organic hair spas with our master stylists.',
      images: [
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
      ],
      status: 'PUBLISHED',
      freeCancellationWindowHours: 24,
    });

    const offeringCut = await Offering.create({
      serviceId: serviceHair._id,
      name: 'Master Stylist Haircut & Blowdry',
      description: 'Includes consultation, hair wash, precision cut, and blowdry styling.',
      durationMinutes: 45,
      price: 45000, // ₹450.00
      currency: 'INR',
      isActive: true,
    });

    const offeringSpa = await Offering.create({
      serviceId: serviceHair._id,
      name: 'Organic Keratin Deep Spa',
      description: 'Restorative hair therapy using natural keratin extracts.',
      durationMinutes: 60,
      price: 120000, // ₹1,200.00
      currency: 'INR',
      isActive: true,
    });

    // Service 2: Swedish Relaxation Spa
    const serviceSpa = await Service.create({
      vendorId: approvedProfile._id,
      categoryId: catSpa._id,
      title: 'Aromatherapy & Swedish Body Therapy',
      slug: 'aromatherapy-swedish-body-therapy',
      description: 'Rejuvenate your senses with essential herbal oils and tailored pressure therapies.',
      images: [
        'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80',
      ],
      status: 'PUBLISHED',
      freeCancellationWindowHours: 24,
    });

    const offeringMassage = await Offering.create({
      serviceId: serviceSpa._id,
      name: '60-Min Swedish Body Massage',
      description: 'Full body stress-relief massage with warm lavender aroma oils.',
      durationMinutes: 60,
      price: 180000, // ₹1,800.00
      currency: 'INR',
      isActive: true,
    });

    // Service 3: Draft Service (for testing draft privacy rules)
    await Service.create({
      vendorId: approvedProfile._id,
      categoryId: catSpa._id,
      title: 'Bridal Makeover Package (Coming Soon)',
      slug: 'bridal-makeover-package',
      description: 'Exclusive bridal packages including trial sessions and on-location service.',
      images: [],
      status: 'DRAFT',
      freeCancellationWindowHours: 48,
    });

    console.log(`[Seed] Seeding Weekly Availability Rules & Exceptions...`);
    // Monday to Saturday: 09:00 - 13:00 and 14:00 - 18:00, Capacity = 3
    const days = [1, 2, 3, 4, 5, 6]; // Mon to Sat
    const rulesToInsert: any[] = [];

    days.forEach((dayOfWeek) => {
      rulesToInsert.push({
        serviceId: serviceHair._id,
        dayOfWeek,
        startTime: '09:00',
        endTime: '13:00',
        capacity: 3, // Capacity of 3 per slot for concurrency testing!
      });
      rulesToInsert.push({
        serviceId: serviceHair._id,
        dayOfWeek,
        startTime: '14:00',
        endTime: '18:00',
        capacity: 3,
      });

      // Also for spa
      rulesToInsert.push({
        serviceId: serviceSpa._id,
        dayOfWeek,
        startTime: '10:00',
        endTime: '18:00',
        capacity: 2,
      });
    });

    await AvailabilityRule.insertMany(rulesToInsert);

    // Date Exception: Holiday closure on 2026-08-30
    await DateException.create({
      serviceId: serviceHair._id,
      date: '2026-08-30',
      isClosed: true,
      reason: 'Salon Deep Cleaning & Equipment Maintenance Day',
    });

    console.log(`[Seed] Seeding Bookings in Assorted States...`);
    // Booking 1: CONFIRMED (Paid with PAY_NOW)
    const booking1 = await Booking.create({
      bookingNumber: 'BK-2026-0001',
      customerId: customer1._id,
      vendorId: approvedProfile._id,
      serviceId: serviceHair._id,
      offeringId: offeringCut._id,
      date: '2026-08-27',
      startTime: '10:30',
      endTime: '11:15',
      status: 'CONFIRMED',
      price: offeringCut.price,
      currency: offeringCut.currency,
      paymentMode: 'PAY_NOW',
      notes: 'Customer prefers organic shampoo.',
    });

    await SlotCapacity.create({
      serviceId: serviceHair._id,
      date: '2026-08-27',
      startTime: '10:30',
      endTime: '11:15',
      maxCapacity: 3,
      bookedCount: 1,
    });

    await Payment.create({
      bookingId: booking1._id,
      amount: offeringCut.price,
      currency: 'INR',
      provider: 'MOCK',
      providerRef: 'mock_pay_seed001',
      idempotencyKey: 'idem_seed_001',
      status: 'SUCCESS',
      tokenUsed: 'tok_success',
    });

    await BookingTimeline.create({
      bookingId: booking1._id,
      fromStatus: null,
      toStatus: 'CONFIRMED',
      changedByUserId: customer1._id,
      reason: 'Booking created with instant PAY_NOW confirmation',
    });

    // Booking 2: PENDING (PAY_AFTER)
    const booking2 = await Booking.create({
      bookingNumber: 'BK-2026-0002',
      customerId: customer1._id,
      vendorId: approvedProfile._id,
      serviceId: serviceSpa._id,
      offeringId: offeringMassage._id,
      date: '2026-08-28',
      startTime: '14:00',
      endTime: '15:00',
      status: 'PENDING',
      price: offeringMassage.price,
      currency: offeringMassage.currency,
      paymentMode: 'PAY_AFTER',
    });

    await SlotCapacity.create({
      serviceId: serviceSpa._id,
      date: '2026-08-28',
      startTime: '14:00',
      endTime: '15:00',
      maxCapacity: 2,
      bookedCount: 1,
    });

    await BookingTimeline.create({
      bookingId: booking2._id,
      fromStatus: null,
      toStatus: 'PENDING',
      changedByUserId: customer1._id,
      reason: 'Customer placed booking in PAY_AFTER mode',
    });

    // Booking 3: COMPLETED (with cash payment marked collected)
    const booking3 = await Booking.create({
      bookingNumber: 'BK-2026-0003',
      customerId: customer1._id,
      vendorId: approvedProfile._id,
      serviceId: serviceHair._id,
      offeringId: offeringCut._id,
      date: '2026-08-20',
      startTime: '11:00',
      endTime: '11:45',
      status: 'COMPLETED',
      price: offeringCut.price,
      currency: offeringCut.currency,
      paymentMode: 'PAY_AFTER',
    });

    await Payment.create({
      bookingId: booking3._id,
      amount: offeringCut.price,
      currency: 'INR',
      provider: 'MOCK',
      providerRef: 'mock_cash_seed003',
      status: 'SUCCESS',
      collectedByVendorId: approvedProfile._id,
      collectedAt: new Date('2026-08-20T12:00:00Z'),
    });

    await BookingTimeline.create([
      {
        bookingId: booking3._id,
        fromStatus: null,
        toStatus: 'CONFIRMED',
        changedByUserId: customer1._id,
        reason: 'Booking requested',
      },
      {
        bookingId: booking3._id,
        fromStatus: 'CONFIRMED',
        toStatus: 'COMPLETED',
        changedByUserId: vendorApprovedUser._id,
        reason: 'Haircut service successfully delivered',
      },
    ]);

    // Booking 4: CANCELLED (with refund)
    const booking4 = await Booking.create({
      bookingNumber: 'BK-2026-0004',
      customerId: customer1._id,
      vendorId: approvedProfile._id,
      serviceId: serviceHair._id,
      offeringId: offeringSpa._id,
      date: '2026-08-22',
      startTime: '15:00',
      endTime: '16:00',
      status: 'CANCELLED',
      price: offeringSpa.price,
      currency: offeringSpa.currency,
      paymentMode: 'PAY_NOW',
      cancellationReason: 'Customer requested cancellation due to travel schedule.',
    });

    const payment4 = await Payment.create({
      bookingId: booking4._id,
      amount: offeringSpa.price,
      currency: 'INR',
      provider: 'MOCK',
      providerRef: 'mock_pay_seed004',
      status: 'REFUNDED',
      refunds: [
        {
          amount: offeringSpa.price,
          reason: 'Customer cancelled within free 24-hour window',
          refundedAt: new Date('2026-08-21T10:00:00Z'),
          providerRef: 'mock_ref_seed004',
        },
      ],
    });

    await BookingTimeline.create([
      {
        bookingId: booking4._id,
        fromStatus: null,
        toStatus: 'CONFIRMED',
        changedByUserId: customer1._id,
        reason: 'PAY_NOW booking confirmed',
      },
      {
        bookingId: booking4._id,
        fromStatus: 'CONFIRMED',
        toStatus: 'CANCELLED',
        changedByUserId: customer1._id,
        reason: 'Customer cancelled within free window; ₹1,200.00 refunded',
      },
    ]);

    console.log(`\n======================================================`);
    console.log(`✅ SEEDING COMPLETE! Credentials for Reviewers:`);
    console.log(`======================================================`);
    console.log(`1. Super Admin:        superadmin@marketplace.com      | Password123!`);
    console.log(`2. Sub-Admin (Moderator): moderator@marketplace.com    | Password123!`);
    console.log(`3. Approved Vendor:    vendor.approved@marketplace.com | Password123!`);
    console.log(`4. Pending Vendor:     vendor.pending@marketplace.com  | Password123!`);
    console.log(`5. Rejected Vendor:    vendor.rejected@marketplace.com | Password123!`);
    console.log(`6. Customer 1 (Active): customer1@marketplace.com      | Password123!`);
    console.log(`7. Customer 2 (New):    customer2@marketplace.com      | Password123!`);
    console.log(`======================================================\n`);

    if (exitOnComplete) {
      process.exit(0);
    }
  } catch (err) {
    console.error('[Seed Error] Database seeding failed:', err);
    if (exitOnComplete) {
      process.exit(1);
    }
    throw err;
  }
}

// If invoked directly via tsx src/seed.ts
if (require.main === module) {
  seedDatabase(true);
}
