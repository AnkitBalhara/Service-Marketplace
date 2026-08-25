import { z } from 'zod';

export const processPaymentSchema = z.object({
  body: z.object({
    bookingId: z.string().min(1, 'Booking ID is required'),
    token: z.string().default('tok_success'),
  }),
});

export const webhookSchema = z.object({
  body: z.object({
    event: z.enum(['payment.success', 'payment.failed']),
    providerRef: z.string().min(1, 'Provider reference is required'),
    reason: z.string().optional(),
  }),
});
