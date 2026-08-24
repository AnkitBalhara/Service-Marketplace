import crypto from 'crypto';
import { Types } from 'mongoose';
import {
  Booking,
  BookingTimeline,
  Service,
  Offering,
  SlotCapacity,
  AvailabilityRule,
  DateException,
  Payment,
  VendorProfile,
  User,
} from '../models';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  UnprocessableError,
} from '../utils/errors';
import {
  minutesToTime,
  timeToMinutes,
  isSlotInPast,
  isWithinFreeCancellationWindow,
} from '../utils/time';
import { paymentService } from './payment.service';
import { AuthenticatedUser, BookingStatus, PaymentMode } from '../types';

export class BookingService {
  /**
   * Helper to generate human-readable unique booking number
   */
  private generateBookingNumber(): string {
    const year = new Date().getFullYear();
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `BK-${year}-${randomHex}`;
  }

  /**
   * Helper to determine base capacity and end time for a given slot
   */
  private async getSlotDetails(
    serviceId: Types.ObjectId,
    offeringId: Types.ObjectId,
    dateStr: string,
    startTimeStr: string
  ) {
    const service = await Service.findById(serviceId);
    if (!service) {
      throw new NotFoundError('SERVICE_NOT_FOUND', 'Service not found');
    }

    if (service.status === 'SUSPENDED') {
      throw new ForbiddenError('SERVICE_SUSPENDED', 'This service has been suspended by administration and cannot accept new bookings');
    }
    if (service.status === 'DRAFT') {
      throw new ForbiddenError('SERVICE_DRAFT', 'This service is currently unpublished');
    }

    const offering = await Offering.findOne({ _id: offeringId, serviceId: service._id, isActive: true });
    if (!offering) {
      throw new NotFoundError('OFFERING_NOT_FOUND', 'Service offering not found or inactive');
    }

    const vendor = await VendorProfile.findById(service.vendorId);
    if (!vendor || vendor.status !== 'APPROVED') {
      throw new ForbiddenError('VENDOR_NOT_APPROVED', 'Vendor is not currently approved to accept bookings');
    }

    const timezone = vendor.timezone || 'Asia/Kolkata';

    // 1. Past slot check
    if (isSlotInPast(dateStr, startTimeStr, timezone)) {
      throw new BadRequestError('SLOT_IN_PAST', 'Cannot book a slot that has already passed');
    }

    // 2. Compute end time
    const startMins = timeToMinutes(startTimeStr);
    const endMins = startMins + offering.durationMinutes;
    const endTimeStr = minutesToTime(endMins);

    // 3. Resolve capacity from exceptions or rules
    const dateObj = new Date(dateStr);
    const dayOfWeek = dateObj.getDay();

    const exception = await DateException.findOne({ serviceId: service._id, date: dateStr });
    let slotCapacity = 1;

    if (exception) {
      if (exception.isClosed) {
        throw new BadRequestError('VENDOR_CLOSED', 'The vendor is closed on the selected date', {
          reason: exception.reason || 'Closed on this date',
        });
      }
      if (exception.customWindows && exception.customWindows.length > 0) {
        const matchingWindow = exception.customWindows.find(
          (w) => timeToMinutes(w.startTime) <= startMins && timeToMinutes(w.endTime) >= endMins
        );
        if (!matchingWindow) {
          throw new BadRequestError('SLOT_NOT_OFFERED', 'Selected time is outside the vendor custom open hours');
        }
        slotCapacity = matchingWindow.capacity;
      }
    } else {
      const rule = await AvailabilityRule.findOne({
        serviceId: service._id,
        dayOfWeek,
        $expr: {
          $and: [
            { $lte: [{ $toInt: { $concat: [{ $substr: ['$startTime', 0, 2] }, { $substr: ['$startTime', 3, 2] }] } }, parseInt(startTimeStr.replace(':', ''), 10)] },
            { $gte: [{ $toInt: { $concat: [{ $substr: ['$endTime', 0, 2] }, { $substr: ['$endTime', 3, 2] }] } }, parseInt(endTimeStr.replace(':', ''), 10)] },
          ],
        },
      });

      // Simple fallback matching if aggregation expression is broad
      const allDayRules = await AvailabilityRule.find({ serviceId: service._id, dayOfWeek });
      const matchingRule = allDayRules.find(
        (r) => timeToMinutes(r.startTime) <= startMins && timeToMinutes(r.endTime) >= endMins
      );

      if (!matchingRule) {
        throw new BadRequestError('SLOT_NOT_OFFERED', 'Selected time is outside vendor standard operating hours');
      }

      slotCapacity = matchingRule.capacity;
    }

    return {
      service,
      offering,
      vendor,
      endTimeStr,
      slotCapacity,
    };
  }

  /**
   * M6: Atomic Booking Creation with Concurrency Lock
   */
  public async createBooking(params: {
    customerId: string;
    serviceId: string;
    offeringId: string;
    date: string;
    startTime: string;
    paymentMode: PaymentMode;
    paymentToken?: string;
    idempotencyKey?: string;
    notes?: string;
  }) {
    const {
      customerId,
      serviceId,
      offeringId,
      date,
      startTime,
      paymentMode,
      paymentToken,
      idempotencyKey,
      notes,
    } = params;

    const sId = new Types.ObjectId(serviceId);
    const oId = new Types.ObjectId(offeringId);
    const cId = new Types.ObjectId(customerId);

    // 1. Verify slot rules and get maximum capacity
    const details = await this.getSlotDetails(sId, oId, date, startTime);
    const { service, offering, vendor, endTimeStr, slotCapacity } = details;

    // 2. Ensure atomic SlotCapacity record exists for this slot
    await SlotCapacity.findOneAndUpdate(
      { serviceId: sId, date, startTime },
      {
        $setOnInsert: {
          serviceId: sId,
          date,
          startTime,
          endTime: endTimeStr,
          maxCapacity: slotCapacity,
          bookedCount: 0,
        },
      },
      { upsert: true, new: true }
    );

    // 3. ATOMIC DATABASE-LEVEL CAPACITY INCREMENT
    // Evaluates filter { bookedCount: { $lt: maxCapacity } }
    // Single-document atomic write lock ensures no overbooking
    const reservedSlot = await SlotCapacity.findOneAndUpdate(
      {
        serviceId: sId,
        date,
        startTime,
        $expr: { $lt: ['$bookedCount', '$maxCapacity'] },
      },
      {
        $inc: { bookedCount: 1 },
      },
      { new: true }
    );

    if (!reservedSlot) {
      throw new ConflictError(
        'SLOT_CAPACITY_EXCEEDED',
        'The selected time slot is fully booked. Please select another slot.'
      );
    }

    // 4. Determine initial booking status based on payment mode
    let initialStatus: BookingStatus = paymentMode === 'PAY_NOW' ? 'CONFIRMED' : 'PENDING';
    const bookingNumber = this.generateBookingNumber();

    const booking = await Booking.create({
      bookingNumber,
      customerId: cId,
      vendorId: vendor._id,
      serviceId: service._id,
      offeringId: offering._id,
      date,
      startTime,
      endTime: endTimeStr,
      status: initialStatus,
      price: offering.price,
      currency: offering.currency,
      paymentMode,
      notes,
    });

    // 5. If PAY_NOW, process mock payment immediately
    if (paymentMode === 'PAY_NOW') {
      const paymentResult = await paymentService.processPayment({
        bookingId: booking._id.toString(),
        amount: offering.price,
        currency: offering.currency,
        token: paymentToken || 'tok_success',
        idempotencyKey,
      });

      if (paymentResult.status === 'FAILED') {
        // Payment failed: mark booking CANCELLED and immediately release slot capacity
        booking.status = 'CANCELLED';
        booking.cancellationReason = paymentResult.errorMessage || 'Payment transaction failed';
        await booking.save();

        await SlotCapacity.updateOne(
          { serviceId: sId, date, startTime, bookedCount: { $gt: 0 } },
          { $inc: { bookedCount: -1 } }
        );

        await BookingTimeline.create({
          bookingId: booking._id,
          fromStatus: null,
          toStatus: 'CANCELLED',
          changedByUserId: cId,
          reason: `PAY_NOW payment failed (${paymentResult.errorMessage}); slot released`,
        });

        throw new BadRequestError('PAYMENT_FAILED', paymentResult.errorMessage || 'Payment was declined', {
          bookingId: booking._id.toString(),
          paymentId: paymentResult.paymentId,
        });
      }

      if (paymentResult.isAsyncPending) {
        // Delayed token: booking stays PENDING until webhook
        booking.status = 'PENDING';
        await booking.save();
      }
    }

    // 6. Write Initial Timeline Record
    await BookingTimeline.create({
      bookingId: booking._id,
      fromStatus: null,
      toStatus: booking.status,
      changedByUserId: cId,
      reason: `Booking created (${paymentMode} mode)`,
      metadata: {
        offeringName: offering.name,
        price: offering.price,
        currency: offering.currency,
      },
    });

    return booking;
  }

  /**
   * Reschedules an active booking to a new slot
   */
  public async rescheduleBooking(params: {
    bookingId: string;
    userId: string;
    newDate: string;
    newStartTime: string;
    reason?: string;
  }) {
    const { bookingId, userId, newDate, newStartTime, reason } = params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('BOOKING_NOT_FOUND', 'Booking not found');
    }

    // State validation
    if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
      throw new UnprocessableError(
        'CANNOT_RESCHEDULE',
        `Cannot reschedule a booking in ${booking.status} status`
      );
    }

    const details = await this.getSlotDetails(
      booking.serviceId,
      booking.offeringId,
      newDate,
      newStartTime
    );

    const { endTimeStr, slotCapacity } = details;

    // Ensure new SlotCapacity document exists
    await SlotCapacity.findOneAndUpdate(
      { serviceId: booking.serviceId, date: newDate, startTime: newStartTime },
      {
        $setOnInsert: {
          serviceId: booking.serviceId,
          date: newDate,
          startTime: newStartTime,
          endTime: endTimeStr,
          maxCapacity: slotCapacity,
          bookedCount: 0,
        },
      },
      { upsert: true, new: true }
    );

    // Atomically reserve new slot
    const newSlot = await SlotCapacity.findOneAndUpdate(
      {
        serviceId: booking.serviceId,
        date: newDate,
        startTime: newStartTime,
        $expr: { $lt: ['$bookedCount', '$maxCapacity'] },
      },
      { $inc: { bookedCount: 1 } },
      { new: true }
    );

    if (!newSlot) {
      throw new ConflictError(
        'SLOT_CAPACITY_EXCEEDED',
        'The newly selected slot is fully booked. Please select another slot.'
      );
    }

    // Release capacity from old slot
    await SlotCapacity.updateOne(
      {
        serviceId: booking.serviceId,
        date: booking.date,
        startTime: booking.startTime,
        bookedCount: { $gt: 0 },
      },
      { $inc: { bookedCount: -1 } }
    );

    const oldDate = booking.date;
    const oldStart = booking.startTime;

    booking.date = newDate;
    booking.startTime = newStartTime;
    booking.endTime = endTimeStr;
    await booking.save();

    // Record timeline
    await BookingTimeline.create({
      bookingId: booking._id,
      fromStatus: booking.status,
      toStatus: booking.status,
      changedByUserId: new Types.ObjectId(userId),
      reason: reason || `Rescheduled from ${oldDate} ${oldStart} to ${newDate} ${newStartTime}`,
      metadata: {
        oldSlot: { date: oldDate, startTime: oldStart },
        newSlot: { date: newDate, startTime: newStartTime },
      },
    });

    return booking;
  }

  /**
   * Transitions booking through lifecycle state machine
   */
  public async transitionBooking(params: {
    bookingId: string;
    nextStatus: BookingStatus;
    user: AuthenticatedUser;
    reason?: string;
  }) {
    const { bookingId, nextStatus, user, reason } = params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('BOOKING_NOT_FOUND', 'Booking not found');
    }

    const currentStatus = booking.status;

    // Terminal state protection
    if (['COMPLETED', 'REJECTED', 'CANCELLED', 'NO_SHOW'].includes(currentStatus)) {
      throw new UnprocessableError(
        'ILLEGAL_STATE_TRANSITION',
        `Booking is already in terminal state '${currentStatus}' and cannot be modified`
      );
    }

    // State machine transition validation matrix
    const legalTransitions: Record<BookingStatus, BookingStatus[]> = {
      PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED'],
      CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
      COMPLETED: [],
      REJECTED: [],
      CANCELLED: [],
      NO_SHOW: [],
    };

    const allowedNext = legalTransitions[currentStatus] || [];
    if (!allowedNext.includes(nextStatus)) {
      throw new UnprocessableError(
        'ILLEGAL_STATE_TRANSITION',
        `Illegal transition from '${currentStatus}' to '${nextStatus}'. Allowed transitions: [${allowedNext.join(', ')}]`
      );
    }

    // Role and Ownership authorization rules
    if (user.roleName === 'CUSTOMER') {
      if (booking.customerId.toString() !== user.userId) {
        throw new ForbiddenError('FORBIDDEN', 'You cannot modify another customer\'s booking');
      }
      if (nextStatus !== 'CANCELLED') {
        throw new ForbiddenError('FORBIDDEN', 'Customers may only cancel their own bookings');
      }
    } else if (user.roleName === 'VENDOR') {
      if (booking.vendorId.toString() !== user.vendorId) {
        throw new ForbiddenError('FORBIDDEN', 'You cannot modify bookings belonging to another vendor');
      }
    }

    // Handle Cancellation: slot release & refund check
    if (nextStatus === 'CANCELLED' || nextStatus === 'REJECTED') {
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

      // Refund check for paid bookings
      const payment = await Payment.findOne({ bookingId: booking._id, status: 'SUCCESS' });
      if (payment) {
        const service = await Service.findById(booking.serviceId);
        const freeWindow = service?.freeCancellationWindowHours || 24;
        const isFree = isWithinFreeCancellationWindow(booking.date, booking.startTime, freeWindow);

        if (isFree || user.roleName === 'SUPER_ADMIN' || user.roleName === 'ADMIN') {
          await paymentService.refundPayment(
            payment._id.toString(),
            payment.amount,
            reason || 'Automatic refund upon cancellation inside free window'
          );
        }
      }
    }

    booking.status = nextStatus;
    if (reason && (nextStatus === 'CANCELLED' || nextStatus === 'REJECTED')) {
      booking.cancellationReason = reason;
    }
    await booking.save();

    await BookingTimeline.create({
      bookingId: booking._id,
      fromStatus: currentStatus,
      toStatus: nextStatus,
      changedByUserId: new Types.ObjectId(user.userId),
      reason: reason || `Status transitioned to ${nextStatus}`,
    });

    return booking;
  }

  /**
   * Vendor marks payment collected for PAY_AFTER bookings
   */
  public async collectPayment(bookingId: string, vendorUserId: string, vendorId: string) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('BOOKING_NOT_FOUND', 'Booking not found');
    }

    if (booking.vendorId.toString() !== vendorId) {
      throw new ForbiddenError('FORBIDDEN', 'You cannot collect payment for another vendor\'s booking');
    }

    let payment = await Payment.findOne({ bookingId: booking._id });
    if (!payment) {
      payment = await Payment.create({
        bookingId: booking._id,
        amount: booking.price,
        currency: booking.currency,
        provider: 'MOCK',
        providerRef: `mock_cash_${crypto.randomBytes(8).toString('hex')}`,
        status: 'SUCCESS',
        collectedByVendorId: new Types.ObjectId(vendorId),
        collectedAt: new Date(),
      });
    } else {
      payment.status = 'SUCCESS';
      payment.collectedByVendorId = new Types.ObjectId(vendorId);
      payment.collectedAt = new Date();
      await payment.save();
    }

    await BookingTimeline.create({
      bookingId: booking._id,
      fromStatus: booking.status,
      toStatus: booking.status,
      changedByUserId: new Types.ObjectId(vendorUserId),
      reason: `Vendor marked cash / offline payment of ${booking.currency} ${booking.price / 100} as collected`,
    });

    return { message: 'Payment collected successfully', payment };
  }

  /**
   * Gets booking with timeline history and payment details
   */
  public async getBookingDetails(bookingId: string, user: AuthenticatedUser) {
    const booking = await Booking.findById(bookingId)
      .populate('customerId', 'name email phone')
      .populate('vendorId', 'businessName contactNumber address timezone')
      .populate('serviceId', 'title description images freeCancellationWindowHours')
      .populate('offeringId', 'name durationMinutes price currency');

    if (!booking) {
      throw new NotFoundError('BOOKING_NOT_FOUND', 'Booking not found');
    }

    // Ownership Enforcement
    if (user.roleName === 'CUSTOMER') {
      const cId = (booking.customerId as any)._id?.toString() || booking.customerId.toString();
      if (cId !== user.userId) {
        throw new ForbiddenError('FORBIDDEN', 'You do not have access to this booking');
      }
    } else if (user.roleName === 'VENDOR') {
      const vId = (booking.vendorId as any)._id?.toString() || booking.vendorId.toString();
      if (vId !== user.vendorId) {
        throw new ForbiddenError('FORBIDDEN', 'You do not have access to another vendor\'s booking');
      }
    }

    const timeline = await BookingTimeline.find({ bookingId: booking._id })
      .sort({ createdAt: 1 })
      .populate('changedByUserId', 'name email');

    const payment = await Payment.findOne({ bookingId: booking._id });

    return {
      booking,
      timeline,
      payment,
    };
  }
}

export const bookingService = new BookingService();
