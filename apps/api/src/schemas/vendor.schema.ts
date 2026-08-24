import { z } from 'zod';

export const updateVendorProfileSchema = z.object({
  body: z.object({
    businessName: z.string().min(2).optional(),
    contactNumber: z.string().min(8).optional(),
    address: z.string().min(5).optional(),
    timezone: z.string().optional(),
    documents: z
      .array(
        z.object({
          filename: z.string().min(1),
          url: z.string().min(1),
          type: z.string().min(1),
        })
      )
      .optional(),
  }),
});

export const approveVendorSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Vendor ID is required'),
  }),
});

export const rejectVendorSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Vendor ID is required'),
  }),
  body: z.object({
    reason: z.string().min(5, 'A clear rejection reason is required'),
  }),
});
