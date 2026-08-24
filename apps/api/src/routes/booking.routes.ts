import { Router } from 'express';
import { bookingController } from '../controllers/booking.controller';
import { authenticate, requirePermission, extractIdempotencyKey } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import {
  createBookingSchema,
  rescheduleBookingSchema,
  cancelBookingSchema,
  bookingTransitionSchema,
} from '../schemas/booking.schema';

const router = Router();

// Apply auth to all booking routes
router.use(authenticate as any);

router.post(
  '/',
  extractIdempotencyKey as any,
  validateRequest(createBookingSchema),
  requirePermission('booking.create'),
  bookingController.createBooking as any
);

router.get('/customer/me', requirePermission('booking.view'), bookingController.listCustomerBookings as any);

router.get('/:id', requirePermission('booking.view'), bookingController.getBookingDetails as any);

router.post(
  '/:id/reschedule',
  validateRequest(rescheduleBookingSchema),
  requirePermission('booking.reschedule'),
  bookingController.rescheduleBooking as any
);

router.post(
  '/:id/cancel',
  validateRequest(cancelBookingSchema),
  requirePermission('booking.cancel'),
  bookingController.cancelBooking as any
);

router.patch(
  '/:id/confirm',
  validateRequest(bookingTransitionSchema),
  requirePermission('booking.confirm'),
  bookingController.confirmBooking as any
);

router.patch(
  '/:id/reject',
  validateRequest(bookingTransitionSchema),
  requirePermission('booking.reject'),
  bookingController.rejectBooking as any
);

router.patch(
  '/:id/complete',
  validateRequest(bookingTransitionSchema),
  requirePermission('booking.complete'),
  bookingController.completeBooking as any
);

router.patch(
  '/:id/no-show',
  validateRequest(bookingTransitionSchema),
  requirePermission('booking.no_show'),
  bookingController.markNoShow as any
);

router.post(
  '/:id/collect-payment',
  requirePermission('payment.collect'),
  bookingController.collectPayment as any
);

export const bookingRoutes = router;
