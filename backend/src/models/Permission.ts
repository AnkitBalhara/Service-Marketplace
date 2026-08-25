import mongoose, { Document, Schema } from 'mongoose';

export interface IPermission extends Document {
  slug: string;
  resource: string;
  action: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const PermissionSchema = new Schema<IPermission>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    resource: { type: String, required: true, index: true },
    action: { type: String, required: true },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

export const Permission = mongoose.model<IPermission>('Permission', PermissionSchema);
