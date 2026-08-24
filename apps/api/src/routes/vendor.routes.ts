import { Router } from 'express';
import { vendorController } from '../controllers/vendor.controller';
import { authenticate, requirePermission, requireApprovedVendor } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { updateVendorProfileSchema } from '../schemas/vendor.schema';
import {
  createServiceSchema,
  updateServiceSchema,
  createOfferingSchema,
  updateOfferingSchema,
} from '../schemas/service.schema';
import {
  setAvailabilityRulesSchema,
  addDateExceptionSchema,
} from '../schemas/availability.schema';

const router = Router();

// Apply auth to all vendor routes
router.use(authenticate as any);

// Vendor Profile (available even in PENDING/REJECTED status so they can view status)
router.get('/profile', vendorController.getProfile as any);
router.patch('/profile', validateRequest(updateVendorProfileSchema), vendorController.updateProfile as any);

// ALL OPERATIONAL ROUTES REQUIRE APPROVED VENDOR STATUS
router.use(requireApprovedVendor as any);

// Services & Offerings
router.get('/services', requirePermission('service.create'), vendorController.listServices as any);
router.post(
  '/services',
  validateRequest(createServiceSchema),
  requirePermission('service.create'),
  vendorController.createService as any
);
router.patch(
  '/services/:id',
  validateRequest(updateServiceSchema),
  requirePermission('service.update'),
  vendorController.updateService as any
);

router.post(
  '/services/:serviceId/offerings',
  validateRequest(createOfferingSchema),
  requirePermission('service.create'),
  vendorController.createOffering as any
);
router.patch(
  '/offerings/:id',
  validateRequest(updateOfferingSchema),
  requirePermission('service.update'),
  vendorController.updateOffering as any
);

// Availability Rules & Date Exceptions
router.get(
  '/services/:serviceId/availability',
  requirePermission('availability.manage'),
  vendorController.getAvailabilityRules as any
);
router.post(
  '/services/:serviceId/availability',
  validateRequest(setAvailabilityRulesSchema),
  requirePermission('availability.manage'),
  vendorController.setAvailabilityRules as any
);

router.get(
  '/services/:serviceId/exceptions',
  requirePermission('availability.manage'),
  vendorController.getDateExceptions as any
);
router.post(
  '/services/:serviceId/exceptions',
  validateRequest(addDateExceptionSchema),
  requirePermission('availability.manage'),
  vendorController.addDateException as any
);
router.delete(
  '/services/:serviceId/exceptions/:exceptionId',
  requirePermission('availability.manage'),
  vendorController.removeDateException as any
);

// Vendor Bookings
router.get('/bookings', requirePermission('booking.view'), vendorController.listBookings as any);

export const vendorRoutes = router;
