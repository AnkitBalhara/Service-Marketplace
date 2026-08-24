import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Category name is required'),
    slug: z.string().min(2, 'Slug is required'),
    description: z.string().optional(),
    parentId: z.string().nullable().optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    slug: z.string().min(2).optional(),
    description: z.string().optional(),
    parentId: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const createRoleSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Role name is required'),
    description: z.string().min(5, 'Role description is required'),
    permissions: z.array(z.string()).min(1, 'At least one permission slug is required'),
  }),
});

export const updateRoleSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().min(5).optional(),
    permissions: z.array(z.string()).optional(),
  }),
});

export const createSubAdminSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name is required'),
    phone: z.string().optional(),
    roleId: z.string().min(1, 'Role ID is required'),
  }),
});

export const adminBookingsQuerySchema = z.object({
  query: z.object({
    page: z.string().transform((val) => parseInt(val, 10) || 1).optional(),
    limit: z.string().transform((val) => Math.min(parseInt(val, 10) || 10, 50)).optional(),
    status: z.string().optional(),
    vendorId: z.string().optional(),
    customerId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    search: z.string().optional(),
  }),
});
