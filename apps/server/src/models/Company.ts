import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { CompanySize, RevenueRange } from '../types';

export interface ICompany extends Document {
  name: string;
  email: string;
  passwordHash: string;
  size: CompanySize;
  monthlyRevenue: RevenueRange;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    size: {
      type: String,
      enum: ['solo', '2-10', '11-50', '51-200', '200+'] as CompanySize[],
      required: true,
    },
    monthlyRevenue: {
      type: String,
      enum: ['0-5k', '5k-10k', '10k-50k', '50k-100k', '100k+'] as RevenueRange[],
      required: true,
    },
  },
  { timestamps: true }
);

// Pre-save hook to hash password
CompanySchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) {
    return;
  }

  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Instance method to compare password
CompanySchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export default mongoose.model<ICompany>('Company', CompanySchema);
