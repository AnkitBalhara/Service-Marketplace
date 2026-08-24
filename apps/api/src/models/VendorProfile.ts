import mongoose, { Document, Schema, Types } from 'mongoose';
import { VendorStatus } from '../types';

export interface IVendorDocument {
  filename: string;
  url: string;
  type: string;
}

export interface IVendorProfile extends Document {
  userId: Types.ObjectId;
  businessName: string;
  contactNumber: string;
  address: string;
  timezone: string;
  documents: IVendorDocument[];
  status: VendorStatus;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VendorProfileSchema = new Schema<IVendorProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    businessName: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
    documents: [
      {
        filename: { type: String, required: true },
        url: { type: String, required: true },
        type: { type: String, required: true },
      },
    ],
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING', index: true },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

export const VendorProfile = mongoose.model<IVendorProfile>('VendorProfile', VendorProfileSchema);
