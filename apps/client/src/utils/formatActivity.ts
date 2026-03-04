// Re-export formatRelativeTime from centralized date formatters
export { formatRelativeTime } from './dateFormatters';

export function formatActivityMessage(activity: {
  talentName: string;
  jobTitle: string;
  from: string | null;
  to: string;
  changedBy: string;
}): string {
  const { talentName, jobTitle, from, to, changedBy } = activity;
  const isYou = changedBy === 'company';
  const subject = isYou ? 'You' : talentName;

  switch (to) {
    case 'shortlisted':
      return `${subject} shortlisted ${isYou ? talentName : ''} for ${jobTitle}`.replace('  ', ' ').trim();
    case 'screening':
      return `${isYou ? 'You moved' : talentName + ' moved to'} ${isYou ? talentName + ' to' : ''} Screening stage`.replace('  ', ' ').trim();
    case 'interview':
      return `Interview scheduled with ${talentName}`;
    case 'offer':
      return `${talentName} received an offer for ${jobTitle}`;
    case 'finalizing':
      return `${talentName} is being finalized for ${jobTitle}`;
    case 'hired':
      return `${talentName} was hired as ${jobTitle}`;
    case 'rejected':
      return `${talentName} was rejected for ${jobTitle}`;
    default:
      return `${talentName} moved to ${to} for ${jobTitle}`;
  }
}

export function getActivityDotColor(stage: string): string {
  switch (stage) {
    case 'shortlisted': return 'bg-blue-500';
    case 'screening': return 'bg-purple-500';
    case 'interview': return 'bg-amber-500';
    case 'offer': return 'bg-orange-500';
    case 'finalizing': return 'bg-teal-500';
    case 'hired': return 'bg-emerald-500';
    case 'rejected': return 'bg-red-500';
    default: return 'bg-slate-400';
  }
}
