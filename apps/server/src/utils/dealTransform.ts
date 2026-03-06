import { IPipelineEntry } from '../models/PipelineEntry';
import { Finalization } from '../types';

/**
 * Compute frontend stage from backend PipelineEntry state
 * Frontend stages: new_offers | presented | accepted | in_progress | completed
 * Backend maps: offer+status -> stage
 */
function getFrontendStage(entry: IPipelineEntry): string {
  // Completed stage
  if (entry.stage === 'hired') return 'completed';

  // In progress (finalization)
  if (entry.stage === 'finalizing') return 'in_progress';

  // Offer-related stages
  if (entry.stage === 'offer' && entry.offer) {
    const status = entry.offer.status;

    // New offers waiting for admin approval
    if (status === 'pending_approval' || status === 'sent' || status === 'flagged') {
      return 'new_offers';
    }

    // Presented to candidate
    if (status === 'presented' || status === 'under_review' || status === 'negotiating') {
      return 'presented';
    }

    // Accepted by candidate
    if (status === 'accepted') {
      return 'accepted';
    }

    // Declined or withdrawn
    if (status === 'declined' || status === 'withdrawn') {
      return 'presented'; // Keep in presented stage for historical tracking
    }
  }

  // Fallback for other stages (shortlisted, screening, interview)
  return 'new_offers';
}

/**
 * Transform Finalization object to frontend finalizingState format
 */
function transformFinalization(fin: Finalization | undefined): any {
  if (!fin) return null;

  return {
    // Invoice & Payment
    invoiceGenerated: !!fin.payment?.invoiceId,
    invoiceId: fin.payment?.invoiceId || '',
    invoiceAmount: fin.payment?.amount?.toString() || '0',
    invoiceFile: fin.payment?.invoiceFile || null,
    paymentReceived: fin.payment?.status === 'paid',
    paymentMethod: fin.payment?.method || '',
    paymentRef: fin.payment?.transactionId || '',

    // Contract
    contractGenerated: !!fin.contract?.contractId,
    contractId: fin.contract?.contractId || '',
    contractFile: fin.contract?.contractFile || null,
    sentToClient: fin.contract?.sentToClient || false,
    sentToCandidate: fin.contract?.sentToCandidate || false,
    clientSigned: fin.contract?.clientSigned || false,
    candidateSigned: fin.contract?.candidateSigned || false,
    contractFullySigned: fin.contract?.status === 'signed',

    // Payroll
    payrollPartner: fin.payroll?.partner || '',
    payrollRef: fin.payroll?.reference || '',
    payrollBankDetails: fin.payroll?.bankDetailsCollected || false,
    payrollSchedule: fin.payroll?.scheduleConfigured || false,
    payrollFirstPay: fin.payroll?.firstPayDate || null,
    payrollNotes: fin.payroll?.notes || '',
    payrollComplete: fin.payroll?.status === 'complete',

    // Compliance
    complianceTax: fin.compliance?.taxClassification?.confirmed || false,
    complianceLabor: fin.compliance?.laborRequirementsMet || false,
    compliancePrivacy: fin.compliance?.privacyRequirementsMet || false,
    complianceNotes: fin.compliance?.notes || '',
    complianceVerified: fin.compliance?.status === 'verified',
    complianceFile: fin.compliance?.complianceFile || null,

    // CSM
    csmName: fin.csm?.name || '',
    csmAssigned: fin.csm?.status === 'assigned',

    // Start Date
    startCandidateConfirmed: fin.startDate?.candidateConfirmed || false,
    startClientConfirmed: fin.startDate?.clientConfirmed || false,
    startNotes: fin.startDate?.notes || '',
    startDateConfirmed: fin.startDate?.status === 'confirmed',
  };
}

/**
 * Helper function to safely extract ID string from either ObjectId or populated document
 * Handles both cases: populated docs (with _id field) and raw ObjectIds
 */
function getIdString(field: any): string {
  if (!field) return '';

  // If it's a populated document (has _id property)
  if (typeof field === 'object' && field._id) {
    return field._id.toString();
  }

  // If it's an ObjectId or string already
  return field.toString();
}

/**
 * Helper function to format relative time (e.g., "2h ago", "3d ago")
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
}

/**
 * Transform PipelineEntry to frontend Deal format
 * Main transformation function used in all admin deal endpoints
 */
export function transformDealForFrontend(entry: IPipelineEntry): any {
  const stage = getFrontendStage(entry);

  // Extract populated data (company, talent, job)
  const companyData = typeof entry.companyId === 'object' && entry.companyId !== null
    ? entry.companyId as any
    : null;
  const talentData = typeof entry.talentId === 'object' && entry.talentId !== null
    ? entry.talentId as any
    : null;
  const jobData = typeof entry.jobId === 'object' && entry.jobId !== null
    ? entry.jobId as any
    : null;

  return {
    // IDs (convert ObjectId to string, handle both populated and non-populated)
    id: entry._id.toString(),
    companyId: getIdString(entry.companyId),
    talentId: getIdString(entry.talentId),
    jobId: getIdString(entry.jobId),

    // Populated data (names, emails, etc.)
    company: companyData?.name || '',
    candidate: talentData
      ? `${talentData.firstName || ''} ${talentData.lastName || ''}`.trim()
      : '',
    candidateEmail: talentData?.email || '',
    candidateRegion: talentData?.region || '',
    role: jobData?.title || '',

    // Flattened offer fields (for easier frontend access)
    rate: entry.offer?.rate || 0,
    hours: entry.offer?.hoursPerWeek || 0,
    type: entry.offer?.type || 'full_time',
    startDate: entry.offer?.startDate || null,
    hmMessage: entry.offer?.message || '',

    // Stage (computed from backend state)
    stage,

    // Timestamps
    updated: getRelativeTime(entry.updatedAt),

    // Offer flow (flattened for frontend)
    offerApproved: entry.offer?.approvedByAdmin || false,
    offerFlagged: entry.offer?.status === 'flagged',
    flagIssueType: entry.offer?.flagIssue?.issueType || '',
    flagDetails: entry.offer?.flagIssue?.details || '',
    presented: ['presented', 'under_review', 'negotiating', 'accepted'].includes(entry.offer?.status || ''),
    presentedDate: entry.offer?.presentedAt
      ? new Date(entry.offer.presentedAt).toLocaleDateString()
      : '',
    candidateResponse: ['accepted', 'negotiating', 'declined'].includes(entry.offer?.status || '')
      ? entry.offer!.status
      : null,
    counterRate: entry.offer?.counterOffer?.rate || null,
    counterMessage: entry.offer?.counterOffer?.message || null,
    declineReason: entry.offer?.declineReason || '',
    declineNotes: entry.offer?.declineNotes || '',

    // Finalization state (restructured for frontend)
    finalizing: transformFinalization(entry.finalization),

    // Offer details (nested object for compatibility)
    offer: entry.offer ? {
      rate: entry.offer.rate,
      hoursPerWeek: entry.offer.hoursPerWeek,
      type: entry.offer.type, // Already snake_case: 'full_time' | 'part_time'
      startDate: entry.offer.startDate,
      message: entry.offer.message,

      // Admin approval workflow
      offerApproved: entry.offer.approvedByAdmin || false,
      offerFlagged: entry.offer.status === 'flagged',
      flagIssueType: entry.offer.flagIssue?.issueType || '',
      flagDetails: entry.offer.flagIssue?.details || '',

      // Candidate response
      candidateResponse: ['accepted', 'negotiating', 'declined'].includes(entry.offer.status)
        ? entry.offer.status
        : null,
      counterRate: entry.offer.counterOffer?.rate || null,
      counterMessage: entry.offer.counterOffer?.message || null,
      declineReason: entry.offer.declineReason || '',
      declineNotes: entry.offer.declineNotes || '',
    } : null,

    // Timeline events (simplified - just date and event)
    timeline: (entry.timeline || []).map(t => ({
      date: t.date,
      event: t.event,
    })),

    // Timestamps
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

/**
 * Transform array of pipeline entries to deals
 */
export function transformDealsForFrontend(entries: IPipelineEntry[]): any[] {
  return entries.map(transformDealForFrontend);
}

/**
 * Check if all finalization steps are complete
 * Used to validate before marking deal as hired
 */
export function isFinalizationComplete(finalization: Finalization | undefined): boolean {
  if (!finalization) return false;

  const checks = [
    finalization.payment?.status === 'paid',
    finalization.contract?.status === 'signed',
    finalization.payroll?.status === 'complete',
    finalization.compliance?.status === 'verified',
    finalization.csm?.status === 'assigned',
    // finalization.startDate?.status === 'confirmed',
  ];

  return checks.every(check => check === true);
}

/**
 * Get list of incomplete finalization steps
 * Used for error messages when trying to complete deal prematurely
 */
export function getIncompleteSteps(finalization: Finalization | undefined): string[] {
  if (!finalization) return ['All steps'];

  const steps: string[] = [];

  if (finalization.payment?.status !== 'paid') steps.push('Payment');
  if (finalization.contract?.status !== 'signed') steps.push('Contract');
  if (finalization.payroll?.status !== 'complete') steps.push('Payroll');
  if (finalization.compliance?.status !== 'verified') steps.push('Compliance');
  if (finalization.csm?.status !== 'assigned') steps.push('CSM Assignment');
  // if (finalization.startDate?.status !== 'confirmed') steps.push('Start Date');

  return steps;
}
