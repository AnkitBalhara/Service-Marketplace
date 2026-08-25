import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISlotCapacity extends Document {
  serviceId: Types.ObjectId;
  date: string;       // "YYYY-MM-DD"
  startTime: string;  // "09:00"
  endTime: string;    // "09:45"
  maxCapacity: number;
  bookedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const SlotCapacitySchema = new Schema<ISlotCapacity>(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
    date: { type: String, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    maxCapacity: { type: Number, required: true, min: 1 },
    bookedCount: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Compound unique index to guarantee one document per slot
SlotCapacitySchema.index({ serviceId: 1, date: 1, startTime: 1 }, { unique: true });

export const SlotCapacity = mongoose.model<ISlotCapacity>('SlotCapacity', SlotCapacitySchema);
