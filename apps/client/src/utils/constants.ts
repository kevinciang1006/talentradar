export const ROLE_CATEGORY_OPTIONS = [
  { label: 'Administrative', value: 'administrative' },
  { label: 'Executive', value: 'executive' },
  { label: 'Customer Support', value: 'customer_support' },
  { label: 'Sales', value: 'sales' },
  { label: 'Lead Generation', value: 'lead_generation' },
  { label: 'Social Media', value: 'social_media' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Graphic Design', value: 'graphic_design' },
  { label: 'Bookkeeping & Accounting', value: 'bookkeeping_accounting' },
  { label: 'Real Estate', value: 'real_estate' },
  { label: 'E-Commerce', value: 'ecommerce' },
  { label: 'Medical', value: 'medical' },
  { label: 'Legal', value: 'legal' },
  { label: 'Insurance', value: 'insurance' },
  { label: 'Custom', value: 'custom' },
];

export const REGION_OPTIONS = [
  { label: '🌎 Latin America', value: 'latin_america' },
  { label: '🇵🇭 Philippines', value: 'philippines' },
  { label: '🇿🇦 South Africa', value: 'south_africa' },
  { label: '🇪🇬 Egypt', value: 'egypt' },
];

export const ENGLISH_LEVEL_OPTIONS = [
  { label: 'Native', value: 'native' },
  { label: 'Fluent', value: 'fluent' },
  { label: 'Advanced', value: 'advanced' },
  { label: 'Intermediate', value: 'intermediate' },
];

export const AVAILABILITY_OPTIONS = [
  { label: 'Full-time (30-40+ hrs)', value: 'full_time' },
  { label: 'Part-time (20-30 hrs)', value: 'part_time' },
];

export const SORT_OPTIONS = [
  { label: 'Most Relevant', value: 'relevance' },
  { label: 'Rate: Low to High', value: 'hourlyRate_asc' },
  { label: 'Rate: High to Low', value: 'hourlyRate_desc' },
  { label: 'Most Experienced', value: 'experience' },
  { label: 'Recently Added', value: 'newest' },
];

export const REJECTION_REASON_OPTIONS = [
  { label: 'Skills don\'t match requirements', value: 'skills_mismatch' },
  { label: 'Rate too high for budget', value: 'rate_too_high' },
  { label: 'Communication concerns', value: 'poor_communication' },
  { label: 'Not enough experience', value: 'not_enough_experience' },
  { label: 'No-show to interview', value: 'no_show' },
  { label: 'Chose another candidate', value: 'chose_another' },
  { label: 'Candidate declined', value: 'candidate_declined' },
  { label: 'Other', value: 'other' },
];

export const INTERVIEW_STATUS_OPTIONS = [
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Completed', value: 'completed' },
  { label: 'No-show', value: 'no_show' },
  { label: 'Cancelled', value: 'cancelled' },
];

export const OFFER_STATUS_OPTIONS = [
  { label: 'Sent', value: 'sent' },
  { label: 'Pending Approval', value: 'pending_approval' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Presented', value: 'presented' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Negotiating', value: 'negotiating' },
  { label: 'Declined', value: 'declined' },
  { label: 'Withdrawn', value: 'withdrawn' },
  { label: 'Flagged', value: 'flagged' },
];

export const JOB_STATUS_OPTIONS = [
  { label: 'Open', value: 'open' },
  { label: 'Paused', value: 'paused' },
  { label: 'Closed', value: 'closed' },
];

export const PIPELINE_STAGE_CONFIG = {
  shortlisted: { label: 'Shortlisted', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  screening: { label: 'Screening', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  interview: { label: 'Interview', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  offer: { label: 'Offer', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  finalizing: { label: 'Finalizing', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  hired: { label: 'Hired', color: 'bg-green-100 text-green-800 border-green-200' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200' },
} as const;

export const REGION_FLAGS = {
  latin_america: '🌎',
  philippines: '🇵🇭',
  south_africa: '🇿🇦',
  egypt: '🇪🇬',
} as const;

// Helper function to get label from value
export function getRoleCategoryLabel(value: string): string {
  const option = ROLE_CATEGORY_OPTIONS.find(opt => opt.value === value);
  return option?.label || value;
}

export function getRegionLabel(value: string): string {
  const option = REGION_OPTIONS.find(opt => opt.value === value);
  return option?.label || value;
}

export function getEnglishLevelLabel(value: string): string {
  const option = ENGLISH_LEVEL_OPTIONS.find(opt => opt.value === value);
  return option?.label || value;
}

export function getAvailabilityLabel(value: string): string {
  const option = AVAILABILITY_OPTIONS.find(opt => opt.value === value);
  return option?.label || value;
}

export function getRejectionReasonLabel(value: string): string {
  const option = REJECTION_REASON_OPTIONS.find(opt => opt.value === value);
  return option?.label || value;
}

export function getInterviewStatusLabel(value: string): string {
  const option = INTERVIEW_STATUS_OPTIONS.find(opt => opt.value === value);
  return option?.label || value;
}

export function getOfferStatusLabel(value: string): string {
  const option = OFFER_STATUS_OPTIONS.find(opt => opt.value === value);
  return option?.label || value;
}

export function getJobStatusLabel(value: string): string {
  const option = JOB_STATUS_OPTIONS.find(opt => opt.value === value);
  return option?.label || value;
}

export function getPipelineStageLabel(value: string): string {
  return PIPELINE_STAGE_CONFIG[value as keyof typeof PIPELINE_STAGE_CONFIG]?.label || value;
}

export function getPipelineStageColor(value: string): string {
  return PIPELINE_STAGE_CONFIG[value as keyof typeof PIPELINE_STAGE_CONFIG]?.color || '';
}

export function getRegionFlag(value: string): string {
  return REGION_FLAGS[value as keyof typeof REGION_FLAGS] || '';
}
