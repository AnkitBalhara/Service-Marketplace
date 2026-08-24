import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticate, extractIdempotencyKey } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { webhookSchema, processPaymentSchema } from '../schemas/payment.schema';

const router = Router();

// Public webhook simulator endpoint
router.post('/webhook', validateRequest(webhookSchema), paymentController.handleWebhook);

// Protected payment processor endpoint
router.post(
  '/process',
  authenticate as any,
  extractIdempotencyKey as any,
  validateRequest(processPaymentSchema),
  paymentController.processPayment as any
);

export const paymentRoutes = router;
