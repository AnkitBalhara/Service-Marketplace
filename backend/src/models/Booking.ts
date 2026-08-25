import mongoose, { Document, Schema, Types } from 'mongoose';
import { BookingStatus, PaymentMode } from '../types';

export interface IBooking extends Document {
  bookingNumber: string;
  customerId: Types.ObjectId;
  vendorId: Types.ObjectId;
  serviceId: Types.ObjectId;
  offeringId: Types.ObjectId;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "09:00"
  endTime: string; // "09:45"
  status: BookingStatus;
  price: number; // Integer minor units (e.g. 40000 = ₹400.00)
  currency: string;
  paymentMode: PaymentMode;
  cancellationReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    bookingNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'VendorProfile', required: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
    offeringId: { type: Schema.Types.ObjectId, ref: 'Offering', required: true },
    date: { type: String, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'REJECTED', 'CANCELLED', 'NO_SHOW'],
      default: 'PENDING',
      index: true,
    },
    price: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    paymentMode: { type: String, enum: ['PAY_NOW', 'PAY_AFTER'], required: true },
    cancellationReason: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

BookingSchema.index({ customerId: 1, createdAt: -1 });
BookingSchema.index({ vendorId: 1, date: 1, status: 1 });
BookingSchema.index({ serviceId: 1, date: 1, startTime: 1, status: 1 });

export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);
