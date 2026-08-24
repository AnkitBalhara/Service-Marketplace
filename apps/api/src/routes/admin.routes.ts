import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate, requirePermission } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import {
  approveVendorSchema,
  rejectVendorSchema,
} from '../schemas/vendor.schema';
import {
  suspendServiceSchema,
} from '../schemas/service.schema';
import {
  createCategorySchema,
  updateCategorySchema,
  createRoleSchema,
  updateRoleSchema,
  createSubAdminSchema,
  adminBookingsQuerySchema,
} from '../schemas/admin.schema';
import { forceCancelBookingSchema } from '../schemas/booking.schema';

const router = Router();

// Apply auth to all admin routes
router.use(authenticate as any);

// Dashboard
router.get('/metrics', requirePermission('admin.dashboard'), adminController.getDashboardMetrics as any);

// Vendors Onboarding Management
router.get('/vendors', requirePermission('vendor.approve'), adminController.listVendors as any);
router.post(
  '/vendors/:id/approve',
  validateRequest(approveVendorSchema),
  requirePermission('vendor.approve'),
  adminController.approveVendor as any
);
router.post(
  '/vendors/:id/reject',
  validateRequest(rejectVendorSchema),
  requirePermission('vendor.reject'),
  adminController.rejectVendor as any
);

// Services Moderation
router.post(
  '/services/:id/suspend',
  validateRequest(suspendServiceSchema),
  requirePermission('service.suspend'),
  adminController.suspendService as any
);
router.post(
  '/services/:id/reactivate',
  requirePermission('service.suspend'),
  adminController.reactivateService as any
);

// Cross-Vendor Bookings & Force Cancel
router.get(
  '/bookings',
  validateRequest(adminBookingsQuerySchema),
  requirePermission('booking.view_all'),
  adminController.listAllBookings as any
);
router.post(
  '/bookings/:id/force-cancel',
  validateRequest(forceCancelBookingSchema),
  requirePermission('booking.force_cancel'),
  adminController.forceCancelBooking as any
);

// RBAC & Sub-Admins Management
router.get('/roles', requirePermission('role.view'), adminController.listRolesAndPermissions as any);
router.post(
  '/roles',
  validateRequest(createRoleSchema),
  requirePermission('role.create'),
  adminController.createRole as any
);
router.patch(
  '/roles/:id',
  validateRequest(updateRoleSchema),
  requirePermission('role.update'),
  adminController.updateRole as any
);
router.post(
  '/sub-admins',
  validateRequest(createSubAdminSchema),
  requirePermission('role.assign'),
  adminController.createSubAdmin as any
);

// Category Management
router.post(
  '/categories',
  validateRequest(createCategorySchema),
  requirePermission('category.manage'),
  adminController.createCategory as any
);
router.patch(
  '/categories/:id',
  validateRequest(updateCategorySchema),
  requirePermission('category.manage'),
  adminController.updateCategory as any
);

// Audit Logs
router.get('/audit-logs', requirePermission('audit.view'), adminController.listAuditLogs as any);

export const adminRoutes = router;
