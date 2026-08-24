import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICustomWindow {
  startTime: string; // "10:00"
  endTime: string;   // "14:00"
  capacity: number;
}

export interface IDateException extends Document {
  serviceId: Types.ObjectId;
  date: string; // "YYYY-MM-DD"
  isClosed: boolean;
  customWindows: ICustomWindow[];
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DateExceptionSchema = new Schema<IDateException>(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    isClosed: { type: Boolean, default: true },
    customWindows: [
      {
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        capacity: { type: Number, required: true, default: 1 },
      },
    ],
    reason: { type: String },
  },
  { timestamps: true }
);

DateExceptionSchema.index({ serviceId: 1, date: 1 }, { unique: true });

export const DateException = mongoose.model<IDateException>('DateException', DateExceptionSchema);
