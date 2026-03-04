import mongoose, { Schema, Document, Types } from 'mongoose';
import { RoleCategory, Availability, JobStatus } from '../types';

export interface IJob extends Document {
  companyId: Types.ObjectId;
  title: string;
  roleCategory: RoleCategory;
  customRoleName?: string;
  description: string;
  requirements?: string;
  hourlyRateMin: number;
  hourlyRateMax: number;
  availability: Availability;
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    roleCategory: {
      type: String,
      enum: [
        'administrative', 'executive', 'customer_support', 'sales',
        'lead_generation', 'social_media', 'marketing', 'graphic_design',
        'medical', 'legal', 'insurance', 'real_estate',
        'ecommerce', 'bookkeeping_accounting', 'custom',
      ] as RoleCategory[],
      required: true,
    },
    customRoleName: { type: String, trim: true },
    description: { type: String, required: true },
    requirements: { type: String },
    hourlyRateMin: { type: Number, required: true, min: 5 },
    hourlyRateMax: { type: Number, required: true, min: 5 },
    availability: {
      type: String,
      enum: ['full_time', 'part_time'] as Availability[],
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'paused', 'closed'] as JobStatus[],
      default: 'open',
    },
  },
  { timestamps: true }
);

// Index for efficient queries
JobSchema.index({ companyId: 1, status: 1 });

export default mongoose.model<IJob>('Job', JobSchema);
