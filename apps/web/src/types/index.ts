export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'CATALOGUE_MODERATOR' | 'VENDOR' | 'CUSTOMER' | string;

export type VendorStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type ServiceStatus = 'DRAFT' | 'PUBLISHED' | 'SUSPENDED';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED' | 'NO_SHOW';

export type PaymentMode = 'PAY_NOW' | 'PAY_AFTER';

export type PaymentStatus = 'INITIATED' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  roleId: string;
  permissions: string[];
  status: string;
  vendor?: {
    id: string;
    businessName: string;
    status: VendorStatus;
    rejectionReason?: string;
    timezone?: string;
    address?: string;
    contactNumber?: string;
  };
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  isActive: boolean;
  children?: Category[];
}

export interface Offering {
  _id: string;
  serviceId: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number; // minor units
  currency: string;
  isActive: boolean;
}

export interface Service {
  _id: string;
  id?: string;
  title: string;
  slug: string;
  description: string;
  images: string[];
  status: ServiceStatus;
  suspensionReason?: string;
  freeCancellationWindowHours: number;
  category: Category;
  vendor: {
    _id: string;
    businessName: string;
    contactNumber: string;
    address: string;
    timezone: string;
    status?: VendorStatus;
  };
  offerings?: Offering[];
  createdAt: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  remainingCapacity: number;
  isAvailable: boolean;
}

export interface DerivedDaySlots {
  date: string;
  isClosed: boolean;
  closureReason?: string;
  slots: TimeSlot[];
}

export interface BookingTimelineItem {
  _id: string;
  bookingId: string;
  fromStatus: BookingStatus | null;
  toStatus: BookingStatus;
  changedByUserId: {
    _id: string;
    name: string;
    email: string;
  };
  reason?: string;
  metadata?: any;
  createdAt: string;
}

export interface PaymentRecord {
  _id: string;
  bookingId: string;
  amount: number;
  currency: string;
  provider: string;
  providerRef: string;
  status: PaymentStatus;
  tokenUsed?: string;
  refunds: Array<{
    amount: number;
    reason?: string;
    refundedAt: string;
    providerRef: string;
  }>;
  collectedAt?: string;
  createdAt: string;
}

export interface Booking {
  _id: string;
  bookingNumber: string;
  customerId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  vendorId: {
    _id: string;
    businessName: string;
    contactNumber: string;
    address: string;
    timezone: string;
  };
  serviceId: Service;
  offeringId: Offering;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  price: number;
  currency: string;
  paymentMode: PaymentMode;
  cancellationReason?: string;
  notes?: string;
  createdAt: string;
}
