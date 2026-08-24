import mongoose, { Document, Schema, Types } from 'mongoose';
import { PaymentStatus } from '../types';

export interface IPaymentRefund {
  amount: number;
  reason?: string;
  refundedAt: Date;
  providerRef: string;
}

export interface IPayment extends Document {
  bookingId: Types.ObjectId;
  amount: number; // Integer minor units (e.g. 40000 = ₹400.00)
  currency: string;
  provider: string; // 'MOCK'
  providerRef: string;
  idempotencyKey?: string;
  status: PaymentStatus;
  tokenUsed?: string;
  refunds: IPaymentRefund[];
  errorMessage?: string;
  collectedByVendorId?: Types.ObjectId;
  collectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    provider: { type: String, default: 'MOCK' },
    providerRef: { type: String, required: true, unique: true, index: true },
    idempotencyKey: { type: String, unique: true, sparse: true, index: true },
    status: {
      type: String,
      enum: ['INITIATED', 'SUCCESS', 'FAILED', 'REFUNDED'],
      default: 'INITIATED',
      index: true,
    },
    tokenUsed: { type: String },
    refunds: [
      {
        amount: { type: Number, required: true },
        reason: { type: String },
        refundedAt: { type: Date, default: Date.now },
        providerRef: { type: String, required: true },
      },
    ],
    errorMessage: { type: String },
    collectedByVendorId: { type: Schema.Types.ObjectId, ref: 'VendorProfile' },
    collectedAt: { type: Date },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
