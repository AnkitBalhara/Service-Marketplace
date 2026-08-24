import { Response, NextFunction } from 'express';
import { bookingService } from '../services/booking.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { Booking } from '../models';

export class BookingController {
  public async createBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const customerId = req.user!.userId;
      const { serviceId, offeringId, date, startTime, paymentMode, paymentToken, notes } = req.body;
      const idempotencyKey = req.idempotencyKey;

      const booking = await bookingService.createBooking({
        customerId,
        serviceId,
        offeringId,
        date,
        startTime,
        paymentMode,
        paymentToken,
        idempotencyKey,
        notes,
      });

      return sendCreated(res, booking);
    } catch (error) {
      next(error);
    }
  }

  public async rescheduleBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { date, startTime, reason } = req.body;
      const userId = req.user!.userId;

      const booking = await bookingService.rescheduleBooking({
        bookingId: id,
        userId,
        newDate: date,
        newStartTime: startTime,
        reason,
      });

      return sendSuccess(res, booking);
    } catch (error) {
      next(error);
    }
  }

  public async cancelBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const booking = await bookingService.transitionBooking({
        bookingId: id,
        nextStatus: 'CANCELLED',
        user: req.user!,
        reason,
      });

      return sendSuccess(res, booking);
    } catch (error) {
      next(error);
    }
  }

  public async confirmBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body || {};

      const booking = await bookingService.transitionBooking({
        bookingId: id,
        nextStatus: 'CONFIRMED',
        user: req.user!,
        reason: reason || 'Vendor accepted booking',
      });

      return sendSuccess(res, booking);
    } catch (error) {
      next(error);
    }
  }

  public async rejectBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body || {};

      const booking = await bookingService.transitionBooking({
        bookingId: id,
        nextStatus: 'REJECTED',
        user: req.user!,
        reason: reason || 'Vendor declined booking',
      });

      return sendSuccess(res, booking);
    } catch (error) {
      next(error);
    }
  }

  public async completeBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body || {};

      const booking = await bookingService.transitionBooking({
        bookingId: id,
        nextStatus: 'COMPLETED',
        user: req.user!,
        reason: reason || 'Service delivery completed',
      });

      return sendSuccess(res, booking);
    } catch (error) {
      next(error);
    }
  }

  public async markNoShow(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body || {};

      const booking = await bookingService.transitionBooking({
        bookingId: id,
        nextStatus: 'NO_SHOW',
        user: req.user!,
        reason: reason || 'Customer did not arrive for scheduled slot',
      });

      return sendSuccess(res, booking);
    } catch (error) {
      next(error);
    }
  }

  public async collectPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await bookingService.collectPayment(id, req.user!.userId, req.user!.vendorId!);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getBookingDetails(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await bookingService.getBookingDetails(id, req.user!);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async listCustomerBookings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const customerId = req.user!.userId;
      const { page = 1, limit = 10, status } = req.query as any;

      const p = Math.max(1, parseInt(page, 10));
      const l = Math.min(50, Math.max(1, parseInt(limit, 10)));
      const skip = (p - 1) * l;

      const filter: any = { customerId };
      if (status) filter.status = status;

      const [bookings, total] = await Promise.all([
        Booking.find(filter)
          .populate('vendorId', 'businessName contactNumber address')
          .populate('serviceId', 'title description images')
          .populate('offeringId', 'name durationMinutes price currency')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(l),
        Booking.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(total / l) || 1;

      return sendSuccess(res, bookings, 200, {
        pagination: {
          total,
          page: p,
          limit: l,
          totalPages,
          hasNext: p < totalPages,
          hasPrev: p > 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const bookingController = new BookingController();
