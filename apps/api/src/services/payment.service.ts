import crypto from 'crypto';
import { Types } from 'mongoose';
import { Payment, Booking, BookingTimeline, SlotCapacity } from '../models';
import { BadRequestError, NotFoundError, ConflictError } from '../utils/errors';
import { PaymentStatus } from '../types';

export interface PaymentProcessResult {
  paymentId: string;
  providerRef: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  isAsyncPending: boolean;
  errorMessage?: string;
}

export class PaymentService {
  /**
   * Mock payment provider processor
   */
  public async processPayment(params: {
    bookingId: string;
    amount: number;
    currency: string;
    token?: string;
    idempotencyKey?: string;
  }): Promise<PaymentProcessResult> {
    const { bookingId, amount, currency, token = 'tok_success', idempotencyKey } = params;

    // Idempotency check: if an idempotency key was supplied, check if already processed
    if (idempotencyKey) {
      const existingPayment = await Payment.findOne({ idempotencyKey });
      if (existingPayment) {
        return {
          paymentId: existingPayment._id.toString(),
          providerRef: existingPayment.providerRef,
          status: existingPayment.status,
          amount: existingPayment.amount,
          currency: existingPayment.currency,
          isAsyncPending: existingPayment.status === 'INITIATED',
          errorMessage: existingPayment.errorMessage,
        };
      }
    }

    const providerRef = `mock_pay_${crypto.randomBytes(12).toString('hex')}`;
    let status: PaymentStatus = 'INITIATED';
    let isAsyncPending = false;
    let errorMessage: string | undefined;

    // Deterministic Token Evaluator
    if (token === 'tok_fail') {
      status = 'FAILED';
      errorMessage = 'Simulated card decline or insufficient funds';
    } else if (token === 'tok_delay') {
      status = 'INITIATED';
      isAsyncPending = true;
    } else {
      // Default: tok_success or any standard token
      status = 'SUCCESS';
    }

    const payment = await Payment.create({
      bookingId: new Types.ObjectId(bookingId),
      amount,
      currency,
      provider: 'MOCK',
      providerRef,
      idempotencyKey,
      status,
      tokenUsed: token,
      errorMessage,
    });

    return {
      paymentId: payment._id.toString(),
      providerRef: payment.providerRef,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      isAsyncPending,
      errorMessage,
    };
  }

  /**
   * Webhook simulator endpoint handler
   */
  public async handleWebhook(params: {
    event: 'payment.success' | 'payment.failed';
    providerRef: string;
    reason?: string;
  }) {
    const { event, providerRef, reason } = params;

    const payment = await Payment.findOne({ providerRef });
    if (!payment) {
      throw new NotFoundError('PAYMENT_NOT_FOUND', `Payment with reference ${providerRef} not found`);
    }

    // Idempotent webhook delivery check: If already in terminal state, ignore safely
    if (payment.status === 'SUCCESS' || payment.status === 'REFUNDED') {
      return { message: 'Webhook already processed', payment };
    }
    if (payment.status === 'FAILED' && event === 'payment.failed') {
      return { message: 'Webhook already processed', payment };
    }

    const booking = await Booking.findById(payment.bookingId);

    if (event === 'payment.success') {
      payment.status = 'SUCCESS';
      payment.errorMessage = undefined;
      await payment.save();

      if (booking && booking.status === 'PENDING') {
        booking.status = 'CONFIRMED';
        await booking.save();

        await BookingTimeline.create({
          bookingId: booking._id,
          fromStatus: 'PENDING',
          toStatus: 'CONFIRMED',
          changedByUserId: booking.customerId,
          reason: 'Payment succeeded via asynchronous webhook callback',
        });
      }
    } else if (event === 'payment.failed') {
      payment.status = 'FAILED';
      payment.errorMessage = reason || 'Payment failed via webhook callback';
      await payment.save();

      if (booking && booking.status === 'PENDING') {
        booking.status = 'CANCELLED';
        booking.cancellationReason = 'Payment failed via webhook';
        await booking.save();

        // Release slot capacity immediately
        await SlotCapacity.updateOne(
          {
            serviceId: booking.serviceId,
            date: booking.date,
            startTime: booking.startTime,
            bookedCount: { $gt: 0 },
          },
          { $inc: { bookedCount: -1 } }
        );

        await BookingTimeline.create({
          bookingId: booking._id,
          fromStatus: 'PENDING',
          toStatus: 'CANCELLED',
          changedByUserId: booking.customerId,
          reason: 'Payment failed via webhook callback; slot released',
        });
      }
    }

    return {
      message: `Webhook event ${event} processed successfully`,
      paymentId: payment._id.toString(),
      status: payment.status,
    };
  }

  /**
   * Process a refund for a payment
   */
  public async refundPayment(paymentId: string, amount: number, reason: string) {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new NotFoundError('PAYMENT_NOT_FOUND', 'Payment record not found');
    }

    if (payment.status !== 'SUCCESS') {
      throw new BadRequestError('REFUND_NOT_ELIGIBLE', `Cannot refund payment in ${payment.status} status`);
    }

    const refundRef = `mock_ref_${crypto.randomBytes(10).toString('hex')}`;
    payment.status = 'REFUNDED';
    payment.refunds.push({
      amount,
      reason,
      refundedAt: new Date(),
      providerRef: refundRef,
    });

    await payment.save();

    return {
      refundRef,
      refundedAmount: amount,
      status: payment.status,
    };
  }
}

export const paymentService = new PaymentService();
