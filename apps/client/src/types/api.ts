// ============================================
// API Response Envelope
// ============================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: unknown };
  meta?: { total: number; page: number; limit: number; totalPages: number };
}

// ============================================
// Enums (matching backend exactly)
// ============================================
export type Region = 'latin_america' | 'philippines' | 'south_africa' | 'egypt';

export type RoleCategory =
  | 'administrative'
  | 'executive'
  | 'customer_support'
  | 'sales'
  | 'lead_generation'
  | 'social_media'
  | 'marketing'
  | 'graphic_design'
  | 'medical'
  | 'legal'
  | 'insurance'
  | 'real_estate'
  | 'ecommerce'
  | 'bookkeeping_accounting'
  | 'custom';

export type EnglishProficiency = 'native' | 'fluent' | 'advanced' | 'intermediate';

export type LanguageProficiency = 'native' | 'fluent' | 'advanced' | 'intermediate' | 'basic';

export type SkillProficiency = 'expert' | 'advanced' | 'intermediate';

export type Availability = 'full_time' | 'part_time';

export type PipelineStage = 'shortlisted' | 'screening' | 'interview' | 'offer' | 'finalizing' | 'hired' | 'rejected';

export type ScreeningTaskStatus = 'draft' | 'sent' | 'submitted' | 'reviewed';

export type InterviewStatus = 'scheduled' | 'completed' | 'no_show' | 'cancelled';

export type OfferStatus =
  | 'sent'
  | 'pending_approval'
  | 'under_review'
  | 'presented'
  | 'accepted'
  | 'negotiating'
  | 'declined'
  | 'withdrawn'
  | 'flagged';

export type JobStatus = 'open' | 'paused' | 'closed';

export type RejectionReason =
  | 'skills_mismatch'
  | 'rate_too_high'
  | 'poor_communication'
  | 'not_enough_experience'
  | 'no_show'
  | 'chose_another'
  | 'candidate_declined'
  | 'other';

export type TalentStatus = 'active' | 'inactive' | 'hired';

export type PaymentStatus = 'pending' | 'invoiced' | 'paid';

export type ContractStatus = 'pending' | 'generated' | 'sent' | 'signed';

export type PayrollStatus = 'pending' | 'in_progress' | 'complete';

export type ComplianceStatus = 'pending' | 'in_progress' | 'verified';

export type CsmStatus = 'pending' | 'assigned';

export type StartDateStatus = 'pending' | 'confirmed';

export type AdminDealStage = 'new_offers' | 'presented' | 'accepted' | 'in_progress' | 'completed';

// ============================================
// Auth
// ============================================
export interface Company {
  id: string;
  name: string;
  email: string;
  size: string;
  monthlyRevenue: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  company: Company;
}

export interface AdminAuthResponse {
  token: string;
  admin: AdminUser;
}

// ============================================
// Talent
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
  englishScore: number;
  skillsAssessmentPassed: boolean;
  backgroundVerified: boolean;
  remoteWorkHistoryConfirmed: boolean;
  referenceChecked: boolean;
  rlRating: string;
  vettedDate: string;
}

export interface Talent {
  _id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
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
  status: TalentStatus;
  isInPipeline?: boolean;
  pipelineJobTitle?: string;
  pipelineCount?: number; // admin view
  createdAt: string;
}

// ============================================
// Jobs
// ============================================
export interface Job {
  _id: string;
  companyId: string;
  title: string;
  roleCategory: RoleCategory;
  customRoleName?: string;
  description: string;
  requirements?: string;
  hourlyRateMin: number;
  hourlyRateMax: number;
  availability: Availability;
  status: JobStatus;
  candidateCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Pipeline
// ============================================
export interface ScreeningTask {
  title: string;
  description: string;
  dueDate: string;
  status: ScreeningTaskStatus;
  taskLink?: string;
  submissionLink?: string;
  createdAt: string;
}

export interface InterviewDetails {
  scheduledAt: string;
  candidateTimezone: string;
  meetingLink: string;
  status: InterviewStatus;
  notes: string;
  completedAt?: string;
}

export interface CounterOffer {
  rate: number;
  message: string;
  createdAt: string;
}

export interface FlagIssue {
  issueType: string;
  details: string;
  flaggedAt: string;
}

export interface FileMetadata {
  name: string;
  size: number; // bytes
  uploadedAt: string; // ISO 8601
  url: string;
  mimeType: string;
}

export interface TimelineEvent {
  date: string; // ISO 8601
  event: string;
  actorType: 'admin' | 'company' | 'talent' | 'system';
  actorId?: string;
}

export interface NegotiationRound {
  round: number;
  actor: 'company' | 'candidate';
  action: 'initial_offer' | 'counter_offer' | 'revised_offer' | 'accepted_counter' | 'declined_counter';
  rate: number;
  hoursPerWeek?: number;
  message?: string;
  createdAt: string; // ISO 8601
  approvedByAdmin?: boolean;
  presentedAt?: string; // ISO 8601
}

export interface OfferDetails {
  rate: number;
  hoursPerWeek: number;
  type: Availability;
  startDate: string;
  message: string;
  status: OfferStatus;
  sentAt: string;
  respondedAt?: string;
  approvedByAdmin?: boolean;
  approvedAt?: string;
  presentedAt?: string;
  negotiationHistory?: NegotiationRound[];
  counterOffer?: CounterOffer;
  declineReason?: string;
  declineNotes?: string;
  flagIssue?: FlagIssue;
}

export interface Finalization {
  payment: {
    status: PaymentStatus;
    amount?: number;
    invoiceId?: string; // Auto-generated by backend
    invoiceUrl?: string;
    invoiceFile?: FileMetadata;
    method?: 'bank_transfer' | 'credit_card' | 'stripe' | 'other';
    transactionId?: string;
    paidAt?: string;
  };
  contract: {
    status: ContractStatus;
    contractId?: string; // Auto-generated by backend
    contractUrl?: string;
    contractFile?: FileMetadata;
    sentToClient?: boolean;
    sentToCandidate?: boolean;
    clientSigned: boolean;
    candidateSigned: boolean;
    signedAt?: string;
  };
  payroll: {
    status: PayrollStatus;
    partner?: string;
    reference?: string;
    bankDetailsCollected?: boolean;
    scheduleConfigured?: boolean;
    firstPayDate?: string;
    notes?: string;
    completedAt?: string;
  };
  compliance: {
    status: ComplianceStatus;
    taxClassification?: {
      confirmed: boolean;
      classification?: string;
    };
    laborRequirementsMet?: boolean;
    privacyRequirementsMet?: boolean;
    countryRequirementsMet: boolean;
    complianceFile?: FileMetadata;
    notes?: string;
    verifiedAt?: string;
  };
  csm: {
    status: CsmStatus;
    name?: string;
    email?: string;
    phone?: string;
    assignedAt?: string;
  };
  startDate: {
    status: StartDateStatus;
    candidateConfirmed?: boolean;
    clientConfirmed?: boolean;
    notes?: string;
    confirmedDate?: string;
    confirmedAt?: string;
  };
}

export interface StageChange {
  from: PipelineStage | null;
  to: PipelineStage;
  changedAt: string;
  note?: string;
  changedBy: 'company' | 'admin';
}

export interface PipelineNote {
  content: string;
  createdAt: string;
  stage: PipelineStage;
  authorType: 'company' | 'admin';
  authorId?: string;
}

export interface Rejection {
  reason: RejectionReason;
  notes?: string;
  rejectedAt: string;
  rejectedAtStage: PipelineStage;
}

export interface PipelineEntry {
  _id: string;
  id?: string; // Backend auto-converts _id to id
  jobId: string | Job;
  companyId: string | Company;
  talentId: string | Talent;
  stage: PipelineStage;
  stageHistory?: StageChange[];
  notes?: PipelineNote[];
  timeline?: TimelineEvent[];

  // Admin Deals: Backend provides pre-populated display fields
  company?: string;
  candidate?: string;
  candidateEmail?: string;
  candidateRegion?: string;
  role?: string;
  rate?: number;
  hours?: number;
  type?: string;
  startDate?: string;
  hmMessage?: string;
  updated?: string;

  // Admin Deals: Offer flow fields at root level
  offerApproved?: boolean;
  offerFlagged?: boolean;
  flagIssueType?: string;
  flagDetails?: string;
  presented?: boolean;
  presentedDate?: string;
  candidateResponse?: string | null;
  counterRate?: number | null;
  counterMessage?: string | null;
  declineReason?: string;
  declineNotes?: string;

  // Admin Deals: Finalizing state
  finalizing?: {
    // Invoice & Payment
    invoiceGenerated: boolean;
    invoiceId: string;
    invoiceAmount: string;
    invoiceFile: FileMetadata | null;
    paymentReceived: boolean;
    paymentMethod: string;
    paymentRef: string;
    // Contract
    contractGenerated: boolean;
    contractId: string;
    contractFile: FileMetadata | null;
    sentToClient: boolean;
    sentToCandidate: boolean;
    clientSigned: boolean;
    candidateSigned: boolean;
    contractFullySigned: boolean;
    // Payroll
    payrollPartner: string;
    payrollRef: string;
    payrollBankDetails: boolean;
    payrollSchedule: boolean;
    payrollFirstPay: string | null;
    payrollNotes: string;
    payrollComplete: boolean;
    // Compliance
    complianceTax: boolean;
    complianceLabor: boolean;
    compliancePrivacy: boolean;
    complianceNotes: string;
    complianceVerified: boolean;
    complianceFile: FileMetadata | null;
    // CSM
    csmName: string;
    csmAssigned: boolean;
    // Start Date
    startCandidateConfirmed: boolean;
    startClientConfirmed: boolean;
    startNotes: string;
    startDateConfirmed: boolean;
  } | null;

  // Company HM Pipeline: Nested offer object
  offer?: OfferDetails;

  screeningTask?: ScreeningTask;
  interview?: InterviewDetails;
  finalization?: Finalization;
  rejection?: Rejection;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Dashboard
// ============================================
export interface DashboardStats {
  totalShortlisted: number;
  inPipeline: number;
  interviews: number;
  totalHired: number;
  finalizing: number;
}

export interface UpcomingInterview {
  _id: string;
  entryId?: string; // Legacy field, keep for compatibility
  talentId: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    headline?: string;
  };
  jobId: {
    _id: string;
    title: string;
  };
  interview: {
    scheduledAt: string;
    candidateTimezone: string;
    meetingLink: string;
    status: InterviewStatus;
    notes?: string;
  };
}

export interface ActivityItem {
  type: string;
  description: string;
  talentName: string;
  jobTitle: string;
  timestamp: string;
  stage: PipelineStage;
  changedAt?: string;
  from?: PipelineStage;
  to?: PipelineStage;
  changedBy?: 'company' | 'admin';
}

// ============================================
// Admin
// ============================================
export interface AdminDashboardStats {
  activeDeals: number;
  actionRequired: number;
  hiresThisMonth: number;
  revenueThisMonth: number;
}

export interface AdminCompany {
  _id: string;
  name: string;
  email: string;
  size: string;
  monthlyRevenue: string;
  jobCount: number;
  pipelineCount: number;
  hireCount: number;
  createdAt: string;
}

export interface AdminCompanyDetail {
  company: {
    _id: string;
    name: string;
    email: string;
    size: string;
    monthlyRevenue: string;
    createdAt: string;
    updatedAt: string;
  };
  jobs: Array<{
    _id: string;
    title: string;
    roleCategory: string;
    status: 'open' | 'closed' | 'paused';
    hourlyRateMin: number;
    hourlyRateMax: number;
    availability: 'full_time' | 'part_time';
    createdAt: string;
  }>;
  pipelineActivity: Array<{
    _id: string;
    stage: string;
    stageHistory: Array<{
      from: string | null;
      to: string;
      changedAt: string;
      changedBy: string;
    }>;
    jobId: {
      _id: string;
      title: string;
    };
    talentId: {
      _id: string;
      firstName: string;
      lastName: string;
    };
    updatedAt: string;
    createdAt: string;
  }>;
  hires: Array<{
    _id: string;
    stage: 'hired';
    jobId: {
      _id: string;
      title: string;
    };
    talentId: {
      _id: string;
      firstName: string;
      lastName: string;
      avatar: string;
    };
    offer: {
      rate: number;
      hoursPerWeek: number;
      type: 'full_time' | 'part_time';
      startDate: string;
    };
    finalization?: {
      startDate?: {
        confirmedDate?: string;
      };
    };
  }>;
}
