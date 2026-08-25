import { Request } from 'express';
import { Types } from 'mongoose';

export type UserRoleName = 'SUPER_ADMIN' | 'ADMIN' | 'VENDOR' | 'CUSTOMER' | string;

export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export type VendorStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type ServiceStatus = 'DRAFT' | 'PUBLISHED' | 'SUSPENDED';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED' | 'NO_SHOW';

export type PaymentMode = 'PAY_NOW' | 'PAY_AFTER';

export type PaymentStatus = 'INITIATED' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  name: string;
  roleId: string;
  roleName: string;
  permissions: string[];
  vendorId?: string;
  vendorStatus?: VendorStatus;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  idempotencyKey?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface TimeSlot {
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  capacity: number;
  bookedCount: number;
  remainingCapacity: number;
  isAvailable: boolean;
}

export interface DerivedDaySlots {
  date: string; // YYYY-MM-DD
  isClosed: boolean;
  closureReason?: string;
  slots: TimeSlot[];
}
