import { z } from 'zod';

export const createServiceSchema = z.object({
  body: z.object({
    categoryId: z.string().min(1, 'Category ID is required'),
    title: z.string().min(3, 'Title must be at least 3 characters long'),
    description: z.string().min(10, 'Description must be at least 10 characters long'),
    images: z.array(z.string()).default([]),
    status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
    freeCancellationWindowHours: z.number().int().min(0).default(24),
  }),
});

export const updateServiceSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    categoryId: z.string().optional(),
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    images: z.array(z.string()).optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'SUSPENDED']).optional(),
    freeCancellationWindowHours: z.number().int().min(0).optional(),
  }),
});

export const createOfferingSchema = z.object({
  params: z.object({
    serviceId: z.string().min(1),
  }),
  body: z.object({
    name: z.string().min(2, 'Offering name is required'),
    description: z.string().optional(),
    durationMinutes: z.number().int().min(5, 'Duration must be at least 5 minutes'),
    price: z.number().int().min(0, 'Price must be in integer minor units (>= 0)'),
    currency: z.string().default('INR'),
    isActive: z.boolean().default(true),
  }),
});

export const updateOfferingSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    durationMinutes: z.number().int().min(5).optional(),
    price: z.number().int().min(0).optional(),
    currency: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const catalogueQuerySchema = z.object({
  query: z.object({
    page: z.string().transform((val) => parseInt(val, 10) || 1).optional(),
    limit: z.string().transform((val) => Math.min(parseInt(val, 10) || 10, 50)).optional(),
    query: z.string().optional(),
    categoryId: z.string().optional(),
    vendorId: z.string().optional(),
  }),
});

export const suspendServiceSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    reason: z.string().min(5, 'Suspension reason is required'),
  }),
});
