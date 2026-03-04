import { Types } from 'mongoose';

// ============================================
// ENUMS / UNION TYPES
// ============================================

export type Region = 'latin_america' | 'philippines' | 'south_africa' | 'egypt';

export type RoleCategory =
  | 'administrative' | 'executive' | 'customer_support' | 'sales'
  | 'lead_generation' | 'social_media' | 'marketing' | 'graphic_design'
  | 'medical' | 'legal' | 'insurance' | 'real_estate'
  | 'ecommerce' | 'bookkeeping_accounting' | 'custom';

export type EnglishProficiency = 'native' | 'fluent' | 'advanced' | 'intermediate';
export type LanguageProficiency = 'native' | 'fluent' | 'advanced' | 'intermediate' | 'basic';
export type SkillProficiency = 'expert' | 'advanced' | 'intermediate';
export type Availability = 'full_time' | 'part_time';
export type CompanySize = 'solo' | '2-10' | '11-50' | '51-200' | '200+';
export type RevenueRange = '0-5k' | '5k-10k' | '10k-50k' | '50k-100k' | '100k+';

export type PipelineStage =
  | 'shortlisted' | 'screening' | 'interview'
  | 'offer' | 'finalizing' | 'hired' | 'rejected';

export type ScreeningTaskStatus = 'draft' | 'sent' | 'submitted' | 'reviewed';
export type InterviewStatus = 'scheduled' | 'completed' | 'no_show' | 'cancelled';

export type OfferStatus =
  | 'sent' | 'pending_approval' | 'under_review' | 'presented'
  | 'accepted' | 'negotiating' | 'declined' | 'withdrawn' | 'flagged';

export type JobStatus = 'open' | 'paused' | 'closed';

export type RejectionReason =
  | 'skills_mismatch' | 'rate_too_high' | 'poor_communication'
  | 'not_enough_experience' | 'no_show' | 'chose_another'
  | 'candidate_declined' | 'other';

// ============================================
// SUB-DOCUMENT INTERFACES
// ============================================

export interface Skill {
  name: string;
  proficiency: SkillProficiency;
}

export interface WorkExperience {
  title: string;
  company: string;
  startDate: string;
  endDate: string | null;
  description: string;
}

export interface Education {
  degree: string;
  institution: string;
  year: number;
}

export interface Language {
  name: string;
  proficiency: LanguageProficiency;
}

export interface VettingReport {
  englishScore: number;          // 1.0 - 5.0
  skillsAssessmentPassed: boolean;
  backgroundVerified: boolean;
  remoteWorkHistoryConfirmed: boolean;
  referenceChecked: boolean;
  rlRating: string;              // e.g., "Top 1%", "Top 5%"
  vettedDate: Date;
}

export interface ScreeningTask {
  title: string;
  description: string;
  dueDate: Date;
  status: ScreeningTaskStatus;
  taskLink?: string;
  submissionLink?: string;
  createdAt: Date;
}

export interface InterviewDetails {
  scheduledAt: Date;
  candidateTimezone: string;
  meetingLink: string;
  status: InterviewStatus;
  notes: string;
  completedAt?: Date;
}

export interface NegotiationRound {
  round: number;
  actor: 'company' | 'candidate';
  action: 'initial_offer' | 'counter_offer' | 'revised_offer' | 'accepted_counter' | 'declined_counter';
  rate: number;
  hoursPerWeek?: number;
  message?: string;
  createdAt: Date;
  approvedByAdmin?: boolean;
  presentedAt?: Date;
}

export interface OfferDetails {
  rate: number;
  hoursPerWeek: number;
  type: Availability;
  startDate: Date;
  message: string;
  status: OfferStatus;
  sentAt: Date;
  respondedAt?: Date;
  approvedByAdmin?: boolean;
  approvedAt?: Date;
  presentedAt?: Date;
  negotiationHistory?: NegotiationRound[];
  counterOffer?: {
    rate: number;
    message: string;
    createdAt: Date;
  };
  declineReason?: string;
  declineNotes?: string;
  flagIssue?: {
    issueType: string;
    details: string;
    flaggedAt: Date;
  };
}

export interface Finalization {
  payment: {
    status: 'pending' | 'invoiced' | 'paid';
    amount?: number;
    invoiceId?: string;
    invoiceUrl?: string;
    invoiceFile?: FileMetadata;
    method?: 'bank_transfer' | 'credit_card' | 'stripe' | 'other';
    transactionId?: string;
    paidAt?: Date;
  };
  contract: {
    status: 'pending' | 'generated' | 'sent' | 'signed';
    contractId?: string;
    contractUrl?: string;
    contractFile?: FileMetadata;
    sentToClient?: boolean;
    sentToCandidate?: boolean;
    clientSigned: boolean;
    candidateSigned: boolean;
    signedAt?: Date;
  };
  payroll: {
    status: 'pending' | 'in_progress' | 'complete';
    partner?: 'rl_partner' | 'deel' | 'remote_com' | 'other' | string;
    reference?: string;
    bankDetailsCollected?: boolean;
    scheduleConfigured?: boolean;
    firstPayDate?: Date;
    notes?: string;
    completedAt?: Date;
  };
  compliance: {
    status: 'pending' | 'in_progress' | 'verified';
    taxClassification?: {
      confirmed: boolean;
      classification?: string;
    };
    laborRequirementsMet?: boolean;
    privacyRequirementsMet?: boolean;
    countryRequirementsMet: boolean;
    complianceFile?: FileMetadata;
    notes?: string;
    verifiedAt?: Date;
  };
  csm: {
    status: 'pending' | 'assigned';
    name?: string;
    email?: string;
    phone?: string;
    assignedAt?: Date;
  };
  startDate: {
    status: 'pending' | 'confirmed';
    candidateConfirmed?: boolean;
    clientConfirmed?: boolean;
    notes?: string;
    confirmedDate?: Date;
    confirmedAt?: Date;
  };
}

export interface StageChange {
  from: PipelineStage | null;
  to: PipelineStage;
  changedAt: Date;
  note?: string;
  changedBy: 'company' | 'admin';
}

export interface PipelineNote {
  content: string;
  createdAt: Date;
  stage: PipelineStage;
  authorType: 'company' | 'admin';
  authorId: Types.ObjectId;
}

export interface FileMetadata {
  name: string;
  size: number;
  uploadedAt: Date;
  url: string;
  mimeType: string;
}

export interface TimelineEvent {
  date: Date;
  event: string;
  actorType: 'admin' | 'company' | 'talent' | 'system';
  actorId?: Types.ObjectId;
}

// ============================================
// EXPRESS EXTENSIONS
// ============================================

declare global {
  namespace Express {
    interface Request {
      company?: {
        id: string;
        email: string;
        name: string;
      };
      admin?: {
        id: string;
        email: string;
        name: string;
      };
    }
  }
}
