export type PipelineStage = "shortlisted" | "screening" | "interview" | "offer" | "finalizing" | "hired" | "rejected";

export interface ScreeningTask {
  title: string;
  description?: string;
  dueDate?: string;
  status: "draft" | "sent" | "submitted" | "reviewed";
}

export interface InterviewDetails {
  date: string;
  time: string;
  timezone: string;
  candidateTimezone: string;
  candidateTime: string;
  meetingLink: string;
  notes?: string;
  status: "scheduled" | "completed" | "no_show" | "cancelled";
  interviewNotes?: string;
}

export interface OfferDetails {
  rate: number;
  hoursPerWeek: number;
  employmentType: "Full-time" | "Part-time" | "Contract";
  startDate: string;
  message?: string;
  status: "sent" | "under-review" | "presented" | "accepted" | "negotiating" | "declined";
  counterRate?: number;
  counterMessage?: string;
  declineReason?: string;
}

export interface FinalizingChecklist {
  offerAccepted: boolean;
  placementFee: boolean;
  contractSigned: boolean;
  payrollSetup: boolean;
  complianceVerified: boolean;
  csmAssigned: boolean;
  startDateConfirmed: boolean;
}

export interface HiredDetails {
  startDate: string;
  rate: number;
  hoursPerWeek: number;
  employmentType: string;
  csmName: string;
  csmEmail: string;
  csmPhone: string;
  guaranteeEndDate: string;
}

export interface PipelineNote {
  id: string;
  content: string;
  timestamp: string;
  stage: PipelineStage;
}

export interface StageHistoryEntry {
  stage: string;
  date: string;
  color: string;
}

export interface PipelineEntry {
  id: string;
  candidateId: string;
  name: string;
  initials: string;
  role: string;
  rate: number;
  region: string;
  stage: PipelineStage;
  timeInStage: string;
  jobId: string;
  screeningTask?: ScreeningTask;
  interview?: InterviewDetails;
  offer?: OfferDetails;
  finalizing?: FinalizingChecklist;
  hired?: HiredDetails;
  notes: PipelineNote[];
  stageHistory: StageHistoryEntry[];
  rejectionReason?: string;
  rejectionNotes?: string;
}

export const stageConfig: Record<PipelineStage, { label: string; color: string; borderColor: string }> = {
  shortlisted: { label: "Shortlisted", color: "bg-primary", borderColor: "border-l-primary" },
  screening: { label: "Screening", color: "bg-[hsl(270,60%,50%)]", borderColor: "border-l-[hsl(270,60%,50%)]" },
  interview: { label: "Interview", color: "bg-warning", borderColor: "border-l-warning" },
  offer: { label: "Offer", color: "bg-[hsl(25,95%,53%)]", borderColor: "border-l-[hsl(25,95%,53%)]" },
  finalizing: { label: "Finalizing", color: "bg-[hsl(172,66%,50%)]", borderColor: "border-l-[hsl(172,66%,50%)]" },
  hired: { label: "Hired", color: "bg-success", borderColor: "border-l-success" },
  rejected: { label: "Rejected", color: "bg-destructive", borderColor: "border-l-destructive" },
};

export const pipelineStages: PipelineStage[] = ["shortlisted", "screening", "interview", "offer", "finalizing", "hired"];

export const initialPipelineData: PipelineEntry[] = [
  {
    id: "p1", candidateId: "6", name: "Valentina Herrera", initials: "VH", role: "Marketing Assistant", rate: 8, region: "Latin America", stage: "shortlisted", timeInStage: "3 days", jobId: "1",
    notes: [], stageHistory: [{ stage: "Shortlisted", date: "Jan 8", color: "bg-primary" }],
  },
  {
    id: "p2", candidateId: "11", name: "Patricia Santos", initials: "PS", role: "Executive Assistant", rate: 8, region: "Philippines", stage: "shortlisted", timeInStage: "2 days", jobId: "1",
    notes: [], stageHistory: [{ stage: "Shortlisted", date: "Jan 9", color: "bg-primary" }],
  },
  {
    id: "p3", candidateId: "7", name: "Juan dela Cruz", initials: "JC", role: "Lead Generation", rate: 6, region: "Philippines", stage: "screening", timeInStage: "5 days", jobId: "1",
    screeningTask: { title: "Organize sample calendar", status: "submitted" },
    notes: [{ id: "n1", content: "Task submitted, reviewing quality.", timestamp: "2 days ago", stage: "screening" }],
    stageHistory: [{ stage: "Shortlisted", date: "Jan 5", color: "bg-primary" }, { stage: "Moved to Screening", date: "Jan 7", color: "bg-[hsl(270,60%,50%)]" }],
  },
  {
    id: "p4", candidateId: "3", name: "Angela Reyes", initials: "AR", role: "Customer Support", rate: 7, region: "Philippines", stage: "screening", timeInStage: "2 days", jobId: "1",
    notes: [{ id: "n2", content: "Reviewing vetting report. Strong English score.", timestamp: "1 day ago", stage: "screening" }],
    stageHistory: [{ stage: "Shortlisted", date: "Jan 8", color: "bg-primary" }, { stage: "Moved to Screening", date: "Jan 10", color: "bg-[hsl(270,60%,50%)]" }],
  },
  {
    id: "p5", candidateId: "4", name: "Thabo Molefe", initials: "TM", role: "Executive Assistant", rate: 10, region: "South Africa", stage: "interview", timeInStage: "3 days", jobId: "1",
    interview: { date: "Jan 15, 2025", time: "10:00 AM", timezone: "EST", candidateTimezone: "SAST", candidateTime: "5:00 PM", meetingLink: "https://zoom.us/j/123456789", status: "scheduled" },
    notes: [{ id: "n3", content: "Strong candidate, great communication skills.", timestamp: "3 days ago", stage: "screening" }],
    stageHistory: [
      { stage: "Shortlisted", date: "Jan 5", color: "bg-primary" },
      { stage: "Moved to Screening", date: "Jan 7", color: "bg-[hsl(270,60%,50%)]" },
      { stage: "Moved to Interview", date: "Jan 12", color: "bg-warning" },
    ],
  },
  {
    id: "p6", candidateId: "2", name: "Carlos Mendez", initials: "CM", role: "Sales Dev Rep", rate: 11, region: "Latin America", stage: "offer", timeInStage: "2 days", jobId: "1",
    offer: { rate: 11, hoursPerWeek: 40, employmentType: "Full-time", startDate: "January 22, 2025", message: "Hi Carlos, we were impressed with your interview.", status: "presented" },
    notes: [
      { id: "n4", content: "Excellent interview performance.", timestamp: "4 days ago", stage: "interview" },
      { id: "n5", content: "Offer sent at $11/hr.", timestamp: "2 days ago", stage: "offer" },
    ],
    stageHistory: [
      { stage: "Shortlisted", date: "Jan 5", color: "bg-primary" },
      { stage: "Moved to Screening", date: "Jan 7", color: "bg-[hsl(270,60%,50%)]" },
      { stage: "Moved to Interview", date: "Jan 10", color: "bg-warning" },
      { stage: "Interview Completed", date: "Jan 14", color: "bg-warning" },
      { stage: "Offer Sent", date: "Jan 18", color: "bg-[hsl(25,95%,53%)]" },
      { stage: "Offer Presented", date: "Jan 19", color: "bg-[hsl(25,95%,53%)]" },
    ],
  },
  {
    id: "p7", candidateId: "8", name: "Sarah van der Berg", initials: "SB", role: "Graphic Designer", rate: 9, region: "South Africa", stage: "finalizing", timeInStage: "2 days", jobId: "1",
    finalizing: { offerAccepted: true, placementFee: true, contractSigned: true, payrollSetup: false, complianceVerified: false, csmAssigned: false, startDateConfirmed: false },
    notes: [{ id: "n6", content: "Offer accepted! Moving to finalization.", timestamp: "2 days ago", stage: "offer" }],
    stageHistory: [
      { stage: "Shortlisted", date: "Jan 3", color: "bg-primary" },
      { stage: "Moved to Screening", date: "Jan 5", color: "bg-[hsl(270,60%,50%)]" },
      { stage: "Moved to Interview", date: "Jan 8", color: "bg-warning" },
      { stage: "Offer Sent", date: "Jan 15", color: "bg-[hsl(25,95%,53%)]" },
      { stage: "Offer Accepted", date: "Jan 20", color: "bg-[hsl(25,95%,53%)]" },
      { stage: "Finalizing", date: "Jan 22", color: "bg-[hsl(172,66%,50%)]" },
    ],
  },
  {
    id: "p8", candidateId: "1", name: "Maria Rodriguez", initials: "MR", role: "Senior Admin Assistant", rate: 9, region: "Latin America", stage: "hired", timeInStage: "Completed", jobId: "1",
    hired: {
      startDate: "January 22, 2025", rate: 9, hoursPerWeek: 40, employmentType: "Full-time",
      csmName: "Paula Martinez", csmEmail: "paula@remoteleverage.com", csmPhone: "(650) 668-0728",
      guaranteeEndDate: "July 22, 2025",
    },
    notes: [
      { id: "n7", content: "Excellent candidate throughout the process.", timestamp: "Jan 15", stage: "interview" },
      { id: "n8", content: "All onboarding steps completed.", timestamp: "Jan 25", stage: "hired" },
    ],
    stageHistory: [
      { stage: "Shortlisted", date: "Jan 3", color: "bg-primary" },
      { stage: "Moved to Screening", date: "Jan 5", color: "bg-[hsl(270,60%,50%)]" },
      { stage: "Moved to Interview", date: "Jan 8", color: "bg-warning" },
      { stage: "Interview Completed", date: "Jan 12", color: "bg-warning" },
      { stage: "Offer Sent", date: "Jan 15", color: "bg-[hsl(25,95%,53%)]" },
      { stage: "Offer Accepted", date: "Jan 18", color: "bg-[hsl(25,95%,53%)]" },
      { stage: "Finalizing", date: "Jan 20", color: "bg-[hsl(172,66%,50%)]" },
      { stage: "Hired", date: "Jan 25", color: "bg-success" },
    ],
  },
  // Rejected
  {
    id: "p9", candidateId: "12", name: "Diego Morales", initials: "DM", role: "Customer Support Lead", rate: 10, region: "Latin America", stage: "rejected", timeInStage: "", jobId: "1",
    rejectionReason: "Chose another candidate", notes: [], stageHistory: [{ stage: "Shortlisted", date: "Jan 3", color: "bg-primary" }, { stage: "Rejected", date: "Jan 10", color: "bg-destructive" }],
  },
  {
    id: "p10", candidateId: "9", name: "Ahmed Hassan", initials: "AH", role: "Bookkeeper", rate: 7, region: "Egypt", stage: "rejected", timeInStage: "", jobId: "1",
    rejectionReason: "Rate too high for budget", notes: [], stageHistory: [{ stage: "Shortlisted", date: "Jan 4", color: "bg-primary" }, { stage: "Rejected", date: "Jan 8", color: "bg-destructive" }],
  },
  {
    id: "p11", candidateId: "10", name: "Camila Flores", initials: "CF", role: "Real Estate VA", rate: 8, region: "Latin America", stage: "rejected", timeInStage: "", jobId: "1",
    rejectionReason: "No-show to interview", notes: [], stageHistory: [{ stage: "Shortlisted", date: "Jan 5", color: "bg-primary" }, { stage: "Rejected", date: "Jan 12", color: "bg-destructive" }],
  },
];
