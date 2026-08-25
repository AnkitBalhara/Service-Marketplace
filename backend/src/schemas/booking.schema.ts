import { z } from 'zod';

const timeFormatRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createBookingSchema = z.object({
  body: z.object({
    serviceId: z.string().min(1, 'Service ID is required'),
    offeringId: z.string().min(1, 'Offering ID is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    startTime: z.string().regex(timeFormatRegex, 'Start time must be HH:mm (e.g. 10:00)'),
    paymentMode: z.enum(['PAY_NOW', 'PAY_AFTER']),
    paymentToken: z.string().optional(), // For PAY_NOW: "tok_success", "tok_fail", "tok_delay"
    notes: z.string().optional(),
  }),
});

export const rescheduleBookingSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'New date must be YYYY-MM-DD'),
    startTime: z.string().regex(timeFormatRegex, 'New start time must be HH:mm'),
    reason: z.string().optional(),
  }),
});

export const cancelBookingSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    reason: z.string().min(3, 'Cancellation reason is required'),
  }),
});

export const forceCancelBookingSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    reason: z.string().min(5, 'Mandatory admin cancellation reason is required'),
  }),
});

export const bookingTransitionSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    reason: z.string().optional(),
  }).optional(),
});
