import mongoose, { Document, Schema, Types } from 'mongoose';
import { ServiceStatus } from '../types';

export interface IService extends Document {
  vendorId: Types.ObjectId;
  categoryId: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  images: string[];
  status: ServiceStatus;
  suspensionReason?: string;
  freeCancellationWindowHours: number;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'VendorProfile', required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, index: true },
    description: { type: String, required: true },
    images: [{ type: String }],
    status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'SUSPENDED'], default: 'DRAFT', index: true },
    suspensionReason: { type: String },
    freeCancellationWindowHours: { type: Number, default: 24 },
  },
  { timestamps: true }
);

ServiceSchema.index({ vendorId: 1, slug: 1 }, { unique: true });
ServiceSchema.index({ status: 1, categoryId: 1 });

export const Service = mongoose.model<IService>('Service', ServiceSchema);
