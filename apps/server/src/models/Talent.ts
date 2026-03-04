import mongoose, { Schema, Document } from 'mongoose';
import {
  Region,
  RoleCategory,
  EnglishProficiency,
  Availability,
  SkillProficiency,
  LanguageProficiency,
  Skill,
  WorkExperience,
  Education,
  Language,
  VettingReport,
} from '../types';

export interface ITalent extends Document {
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  headline: string;
  bio: string;
  region: Region;
  country: string;
  city: string;
  timezone: string;
  utcOffset: number;
  roleCategories: RoleCategory[];
  skills: Skill[];
  tools: string[];
  experience: WorkExperience[];
  education: Education[];
  languages: Language[];
  hourlyRate: number;
  yearsOfExperience: number;
  englishProficiency: EnglishProficiency;
  availability: Availability;
  isImmediatelyAvailable: boolean;
  weeklyHours: number;
  vettingReport: VettingReport;
  status: 'active' | 'inactive' | 'hired';
  createdAt: Date;
  updatedAt: Date;
  fullName: string; // virtual
}

const SkillSchema = new Schema<Skill>({
  name: { type: String, required: true },
  proficiency: {
    type: String,
    enum: ['expert', 'advanced', 'intermediate'] as SkillProficiency[],
    required: true,
  },
}, { _id: false });

const WorkExperienceSchema = new Schema<WorkExperience>({
  title: { type: String, required: true },
  company: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, default: null },
  description: { type: String, required: true },
}, { _id: false });

const EducationSchema = new Schema<Education>({
  degree: { type: String, required: true },
  institution: { type: String, required: true },
  year: { type: Number, required: true },
}, { _id: false });

const LanguageSchema = new Schema<Language>({
  name: { type: String, required: true },
  proficiency: {
    type: String,
    enum: ['native', 'fluent', 'advanced', 'intermediate', 'basic'] as LanguageProficiency[],
    required: true,
  },
}, { _id: false });

const VettingReportSchema = new Schema<VettingReport>({
  englishScore: { type: Number, required: true, min: 1.0, max: 5.0 },
  skillsAssessmentPassed: { type: Boolean, required: true },
  backgroundVerified: { type: Boolean, required: true },
  remoteWorkHistoryConfirmed: { type: Boolean, required: true },
  referenceChecked: { type: Boolean, required: true },
  rlRating: { type: String, required: true },
  vettedDate: { type: Date, required: true },
}, { _id: false });

const TalentSchema = new Schema<ITalent>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    avatar: { type: String, required: true },
    headline: { type: String, required: true },
    bio: { type: String, required: true },
    region: {
      type: String,
      enum: ['latin_america', 'philippines', 'south_africa', 'egypt'] as Region[],
      required: true,
    },
    country: { type: String, required: true },
    city: { type: String, required: true },
    timezone: { type: String, required: true },
    utcOffset: { type: Number, required: true },
    roleCategories: [{
      type: String,
      enum: [
        'administrative', 'executive', 'customer_support', 'sales',
        'lead_generation', 'social_media', 'marketing', 'graphic_design',
        'medical', 'legal', 'insurance', 'real_estate',
        'ecommerce', 'bookkeeping_accounting', 'custom',
      ] as RoleCategory[],
    }],
    skills: [SkillSchema],
    tools: [{ type: String }],
    experience: [WorkExperienceSchema],
    education: [EducationSchema],
    languages: [LanguageSchema],
    hourlyRate: { type: Number, required: true, min: 5, max: 50 },
    yearsOfExperience: { type: Number, required: true, min: 0 },
    englishProficiency: {
      type: String,
      enum: ['native', 'fluent', 'advanced', 'intermediate'] as EnglishProficiency[],
      required: true,
    },
    availability: {
      type: String,
      enum: ['full_time', 'part_time'] as Availability[],
      required: true,
    },
    isImmediatelyAvailable: { type: Boolean, default: false },
    weeklyHours: { type: Number, required: true },
    vettingReport: { type: VettingReportSchema, required: true },
    status: {
      type: String,
      enum: ['active', 'inactive', 'hired'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// Virtual for fullName
TalentSchema.virtual('fullName').get(function (this: ITalent) {
  return `${this.firstName} ${this.lastName}`;
});

// Indexes
TalentSchema.index({
  firstName: 'text',
  lastName: 'text',
  bio: 'text',
  headline: 'text',
  'skills.name': 'text',
});

TalentSchema.index({
  region: 1,
  roleCategories: 1,
  hourlyRate: 1,
  isImmediatelyAvailable: 1,
});

TalentSchema.index({ status: 1 });

export default mongoose.model<ITalent>('Talent', TalentSchema);
