import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IOffering extends Document {
  serviceId: Types.ObjectId;
  name: string;
  description?: string;
  durationMinutes: number; // e.g. 30, 45, 60
  price: number;           // Integer minor units (e.g. 40000 = ₹400.00)
  currency: string;        // "INR", "USD", etc.
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OfferingSchema = new Schema<IOffering>(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    durationMinutes: { type: Number, required: true, min: 5 },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const Offering = mongoose.model<IOffering>('Offering', OfferingSchema);
