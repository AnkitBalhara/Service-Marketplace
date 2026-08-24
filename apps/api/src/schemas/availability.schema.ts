import { z } from 'zod';

const timeFormatRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const setAvailabilityRulesSchema = z.object({
  params: z.object({
    serviceId: z.string().min(1),
  }),
  body: z.object({
    rules: z.array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        startTime: z.string().regex(timeFormatRegex, 'Format must be HH:mm (e.g. 09:00)'),
        endTime: z.string().regex(timeFormatRegex, 'Format must be HH:mm (e.g. 17:00)'),
        capacity: z.number().int().min(1).default(1),
      })
    ),
  }),
});

export const addDateExceptionSchema = z.object({
  params: z.object({
    serviceId: z.string().min(1),
  }),
  body: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    isClosed: z.boolean().default(true),
    customWindows: z
      .array(
        z.object({
          startTime: z.string().regex(timeFormatRegex),
          endTime: z.string().regex(timeFormatRegex),
          capacity: z.number().int().min(1).default(1),
        })
      )
      .default([]),
    reason: z.string().optional(),
  }),
});

export const getSlotsQuerySchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.object({
    offeringId: z.string().min(1, 'Offering ID is required'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD').optional(),
  }),
});

export const getNextAvailableQuerySchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.object({
    offeringId: z.string().min(1, 'Offering ID is required'),
  }),
});
