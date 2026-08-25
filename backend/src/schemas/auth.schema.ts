import { z } from 'zod';

export const customerRegisterSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    phone: z.string().optional(),
  }),
});

export const vendorRegisterSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    name: z.string().min(2, 'Contact person name must be at least 2 characters'),
    businessName: z.string().min(2, 'Business name is required'),
    contactNumber: z.string().min(8, 'Valid contact number is required'),
    address: z.string().min(5, 'Physical address is required'),
    timezone: z.string().default('Asia/Kolkata'),
    documents: z
      .array(
        z.object({
          filename: z.string().min(1),
          url: z.string().min(1),
          type: z.string().min(1),
        })
      )
      .default([]),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
  }),
});
