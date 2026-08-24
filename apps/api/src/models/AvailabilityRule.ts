import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAvailabilityRule extends Document {
  serviceId: Types.ObjectId;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  capacity: number;  // Max concurrent bookings per slot, default 1
  createdAt: Date;
  updatedAt: Date;
}

const AvailabilityRuleSchema = new Schema<IAvailabilityRule>(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6, index: true },
    startTime: { type: String, required: true }, // Format "HH:mm"
    endTime: { type: String, required: true },   // Format "HH:mm"
    capacity: { type: Number, required: true, min: 1, default: 1 },
  },
  { timestamps: true }
);

export const AvailabilityRule = mongoose.model<IAvailabilityRule>('AvailabilityRule', AvailabilityRuleSchema);
