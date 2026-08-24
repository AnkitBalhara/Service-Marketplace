import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export class PaymentController {
  public async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const { event, providerRef, reason } = req.body;
      const result = await paymentService.handleWebhook({ event, providerRef, reason });
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async processPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { bookingId, token } = req.body;
      const idempotencyKey = req.idempotencyKey;

      const result = await paymentService.processPayment({
        bookingId,
        amount: req.body.amount || 0,
        currency: req.body.currency || 'INR',
        token,
        idempotencyKey,
      });

      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
