import mongoose, { Document, Schema, Types } from 'mongoose';
import { BookingStatus } from '../types';

export interface IBookingTimeline extends Document {
  bookingId: Types.ObjectId;
  fromStatus: BookingStatus | null;
  toStatus: BookingStatus;
  changedByUserId: Types.ObjectId;
  reason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const BookingTimelineSchema = new Schema<IBookingTimeline>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    fromStatus: { type: String, default: null },
    toStatus: { type: String, required: true },
    changedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const BookingTimeline = mongoose.model<IBookingTimeline>('BookingTimeline', BookingTimelineSchema);
