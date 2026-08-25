import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAuditLog extends Document {
  actorUserId: Types.ObjectId;
  action: string; // e.g. "VENDOR_APPROVED", "SERVICE_SUSPENDED", "BOOKING_FORCE_CANCELLED", "ROLE_UPDATED"
  targetType: string; // "VendorProfile", "Service", "Booking", "Role"
  targetId: string;
  payload?: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true, index: true },
    targetType: { type: String, required: true, index: true },
    targetId: { type: String, required: true },
    payload: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
