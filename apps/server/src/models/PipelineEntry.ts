import mongoose, { Schema, Document, Types } from 'mongoose';
import {
  PipelineStage,
  ScreeningTask,
  ScreeningTaskStatus,
  InterviewDetails,
  InterviewStatus,
  OfferDetails,
  OfferStatus,
  Availability,
  Finalization,
  StageChange,
  PipelineNote,
  RejectionReason,
  FileMetadata,
  TimelineEvent,
  NegotiationRound,
} from '../types';

export interface IPipelineEntry extends Document {
  jobId: Types.ObjectId;
  companyId: Types.ObjectId;
  talentId: Types.ObjectId;
  stage: PipelineStage;
  stageHistory: StageChange[];
  notes: PipelineNote[];
  timeline: TimelineEvent[];
  screeningTask?: ScreeningTask;
  interview?: InterviewDetails;
  offer?: OfferDetails;
  finalization?: Finalization;
  rejection?: {
    reason: RejectionReason;
    notes?: string;
    rejectedAt: Date;
    rejectedAtStage: PipelineStage;
  };
  createdAt: Date;
  updatedAt: Date;
}

const FileMetadataSchema = new Schema<FileMetadata>({
  name: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedAt: { type: Date, required: true },
  url: { type: String, required: true },
  mimeType: { type: String, required: true },
}, { _id: false });

const TimelineEventSchema = new Schema<TimelineEvent>({
  date: { type: Date, required: true },
  event: { type: String, required: true },
  actorType: {
    type: String,
    enum: ['admin', 'company', 'talent', 'system'],
    required: true,
  },
  actorId: { type: Schema.Types.ObjectId },
}, { _id: false });

const ScreeningTaskSchema = new Schema<ScreeningTask>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  dueDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['draft', 'sent', 'submitted', 'reviewed'] as ScreeningTaskStatus[],
    required: true,
  },
  taskLink: { type: String },
  submissionLink: { type: String },
  createdAt: { type: Date, required: true },
}, { _id: false });

const InterviewDetailsSchema = new Schema<InterviewDetails>({
  scheduledAt: { type: Date, required: true },
  candidateTimezone: { type: String, required: true },
  meetingLink: { type: String, required: true },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'no_show', 'cancelled'] as InterviewStatus[],
    required: true,
  },
  notes: { type: String, required: true },
  completedAt: { type: Date },
}, { _id: false });

const NegotiationRoundSchema = new Schema<NegotiationRound>({
  round: { type: Number, required: true },
  actor: {
    type: String,
    enum: ['company', 'candidate'],
    required: true,
  },
  action: {
    type: String,
    enum: ['initial_offer', 'counter_offer', 'revised_offer', 'accepted_counter', 'declined_counter'],
    required: true,
  },
  rate: { type: Number, required: true },
  hoursPerWeek: { type: Number },
  message: { type: String },
  createdAt: { type: Date, required: true },
  approvedByAdmin: { type: Boolean },
  presentedAt: { type: Date },
}, { _id: false });

const OfferDetailsSchema = new Schema<OfferDetails>({
  rate: { type: Number, required: true },
  hoursPerWeek: { type: Number, required: true },
  type: {
    type: String,
    enum: ['full_time', 'part_time'] as Availability[],
    required: true,
  },
  startDate: { type: Date, required: true },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ['sent', 'pending_approval', 'under_review', 'presented', 'accepted', 'negotiating', 'declined', 'withdrawn', 'flagged'] as OfferStatus[],
    required: true,
  },
  sentAt: { type: Date, required: true },
  respondedAt: { type: Date },
  approvedByAdmin: { type: Boolean, default: false },
  approvedAt: { type: Date },
  presentedAt: { type: Date },
  negotiationHistory: [NegotiationRoundSchema],
  counterOffer: {
    rate: { type: Number },
    message: { type: String },
    createdAt: { type: Date },
  },
  declineReason: { type: String },
  declineNotes: { type: String },
  flagIssue: {
    issueType: { type: String },
    details: { type: String },
    flaggedAt: { type: Date },
  },
}, { _id: false });

const FinalizationSchema = new Schema<Finalization>({
  payment: {
    status: {
      type: String,
      enum: ['pending', 'invoiced', 'paid'],
      required: true,
    },
    amount: { type: Number },
    invoiceId: { type: String },
    invoiceUrl: { type: String },
    invoiceFile: FileMetadataSchema,
    method: {
      type: String,
      enum: ['bank_transfer', 'credit_card', 'stripe', 'other'],
    },
    transactionId: { type: String },
    paidAt: { type: Date },
  },
  contract: {
    status: {
      type: String,
      enum: ['pending', 'generated', 'sent', 'signed'],
      required: true,
    },
    contractId: { type: String },
    contractUrl: { type: String },
    contractFile: FileMetadataSchema,
    sentToClient: { type: Boolean },
    sentToCandidate: { type: Boolean },
    clientSigned: { type: Boolean, required: true },
    candidateSigned: { type: Boolean, required: true },
    signedAt: { type: Date },
  },
  payroll: {
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'complete'],
      required: true,
    },
    partner: { type: String },
    reference: { type: String },
    bankDetailsCollected: { type: Boolean },
    scheduleConfigured: { type: Boolean },
    firstPayDate: { type: Date },
    notes: { type: String },
    completedAt: { type: Date },
  },
  compliance: {
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'verified'],
      required: true,
    },
    taxClassification: {
      confirmed: { type: Boolean },
      classification: { type: String },
    },
    laborRequirementsMet: { type: Boolean },
    privacyRequirementsMet: { type: Boolean },
    countryRequirementsMet: { type: Boolean, required: true },
    complianceFile: FileMetadataSchema,
    notes: { type: String },
    verifiedAt: { type: Date },
  },
  csm: {
    status: {
      type: String,
      enum: ['pending', 'assigned'],
      required: true,
    },
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    assignedAt: { type: Date },
  },
  startDate: {
    status: {
      type: String,
      enum: ['pending', 'confirmed'],
      required: true,
    },
    candidateConfirmed: { type: Boolean },
    clientConfirmed: { type: Boolean },
    notes: { type: String },
    confirmedDate: { type: Date },
    confirmedAt: { type: Date },
  },
}, { _id: false });

const StageChangeSchema = new Schema<StageChange>({
  from: {
    type: String,
    enum: ['shortlisted', 'screening', 'interview', 'offer', 'finalizing', 'hired', 'rejected', null],
  },
  to: {
    type: String,
    enum: ['shortlisted', 'screening', 'interview', 'offer', 'finalizing', 'hired', 'rejected'] as PipelineStage[],
    required: true,
  },
  changedAt: { type: Date, required: true },
  note: { type: String },
  changedBy: {
    type: String,
    enum: ['company', 'admin'],
    required: true,
  },
}, { _id: false });

const PipelineNoteSchema = new Schema<PipelineNote>({
  content: { type: String, required: true },
  createdAt: { type: Date, required: true },
  stage: {
    type: String,
    enum: ['shortlisted', 'screening', 'interview', 'offer', 'finalizing', 'hired', 'rejected'] as PipelineStage[],
    required: true,
  },
  authorType: {
    type: String,
    enum: ['company', 'admin'],
    required: true,
  },
  authorId: { type: Schema.Types.ObjectId, required: true },
}, { _id: false });

const PipelineEntrySchema = new Schema<IPipelineEntry>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    talentId: {
      type: Schema.Types.ObjectId,
      ref: 'Talent',
      required: true,
    },
    stage: {
      type: String,
      enum: ['shortlisted', 'screening', 'interview', 'offer', 'finalizing', 'hired', 'rejected'] as PipelineStage[],
      default: 'shortlisted',
      required: true,
    },
    stageHistory: [StageChangeSchema],
    notes: [PipelineNoteSchema],
    timeline: {
      type: [TimelineEventSchema],
      default: [],
    },
    screeningTask: ScreeningTaskSchema,
    interview: InterviewDetailsSchema,
    offer: OfferDetailsSchema,
    finalization: FinalizationSchema,
    rejection: {
      reason: {
        type: String,
        enum: [
          'skills_mismatch', 'rate_too_high', 'poor_communication',
          'not_enough_experience', 'no_show', 'chose_another',
          'candidate_declined', 'other',
        ] as RejectionReason[],
      },
      notes: { type: String },
      rejectedAt: { type: Date },
      rejectedAtStage: {
        type: String,
        enum: ['shortlisted', 'screening', 'interview', 'offer', 'finalizing', 'hired', 'rejected'] as PipelineStage[],
      },
    },
  },
  { timestamps: true }
);

// Indexes
PipelineEntrySchema.index({ companyId: 1, jobId: 1 });
PipelineEntrySchema.index({ talentId: 1, companyId: 1 }, { unique: true });
PipelineEntrySchema.index({ companyId: 1, stage: 1 });
PipelineEntrySchema.index({ 'offer.status': 1 });
PipelineEntrySchema.index({ 'offer.approvedByAdmin': 1 });
PipelineEntrySchema.index({ 'timeline.date': -1 });

export default mongoose.model<IPipelineEntry>('PipelineEntry', PipelineEntrySchema);
