import mongoose, { Document, Schema } from 'mongoose';

export interface IRole extends Document {
  name: string;
  description: string;
  permissions: string[]; // Slugs e.g. ["service.create", "vendor.approve"]
  isSystem: boolean;     // If true, cannot be deleted (e.g. SUPER_ADMIN, VENDOR, CUSTOMER)
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    permissions: [{ type: String, required: true }],
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Role = mongoose.model<IRole>('Role', RoleSchema);
