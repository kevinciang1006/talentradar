import { Region, EnglishProficiency, SkillProficiency } from '@/types/api';

/**
 * Get region flag emoji
 */
export function getRegionFlag(region: Region): string {
  const flagMap: Record<Region, string> = {
    latin_america: '🌎',
    philippines: '🇵🇭',
    south_africa: '🇿🇦',
    egypt: '🇪🇬',
  };
  return flagMap[region] || '🌍';
}

/**
 * Get region display name
 */
export function getRegionName(region: Region): string {
  const nameMap: Record<Region, string> = {
    latin_america: 'Latin America',
    philippines: 'Philippines',
    south_africa: 'South Africa',
    egypt: 'Egypt',
  };
  return nameMap[region] || region;
}

/**
 * Get English proficiency display name
 */
export function getEnglishLevel(proficiency: EnglishProficiency): string {
  const levelMap: Record<EnglishProficiency, string> = {
    native: 'Native',
    fluent: 'Fluent',
    advanced: 'Advanced',
    intermediate: 'Intermediate',
  };
  return levelMap[proficiency] || proficiency;
}

/**
 * Get availability display name
 */
export function getAvailabilityLabel(availability: 'full_time' | 'part_time'): string {
  return availability === 'full_time' ? 'Full-time' : 'Part-time';
}

/**
 * Get initials from first and last name
 */
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/**
 * Format work experience period
 */
export function formatExperiencePeriod(startDate: string, endDate: string | null): string {
  const start = new Date(startDate);
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const startYear = start.getFullYear();

  if (!endDate) {
    return `${startMonth} ${startYear} — Present`;
  }

  const end = new Date(endDate);
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const endYear = end.getFullYear();

  return `${startMonth} ${startYear} — ${endMonth} ${endYear}`;
}

/**
 * Group skills by proficiency level
 */
export function groupSkillsByProficiency(skills: Array<{ name: string; proficiency: SkillProficiency }>) {
  return {
    expert: skills.filter(s => s.proficiency === 'expert'),
    advanced: skills.filter(s => s.proficiency === 'advanced'),
    intermediate: skills.filter(s => s.proficiency === 'intermediate'),
  };
}
