import { z } from 'zod';

export const talentQuerySchema = z.object({
  search: z.string().optional(),
  roleCategories: z.string().optional(), // comma-separated
  regions: z.string().optional(), // comma-separated
  hourlyRateMin: z.string().transform(Number).pipe(z.number().positive()).optional(),
  hourlyRateMax: z.string().transform(Number).pipe(z.number().positive()).optional(),
  englishProficiency: z.string().optional(), // comma-separated
  availability: z.enum(['full_time', 'part_time']).optional(),
  isImmediatelyAvailable: z.string().transform((val) => val === 'true').optional(),
  yearsOfExperienceMin: z.string().transform(Number).pipe(z.number().nonnegative()).optional(),
  yearsOfExperienceMax: z.string().transform(Number).pipe(z.number().nonnegative()).optional(),
  sort: z.enum(['relevance', 'hourlyRate_asc', 'hourlyRate_desc', 'experience', 'newest']).optional(),
  page: z.string().default('1').transform(Number).pipe(z.number().int().min(1)),
  limit: z.string().default('20').transform(Number).pipe(z.number().int().min(1).max(100)),
});

export type TalentQueryInput = z.infer<typeof talentQuerySchema>;

// Admin-specific talent query schema (includes status filter)
export const adminTalentQuerySchema = talentQuerySchema.extend({
  status: z.enum(['active', 'in_pipeline', 'hired', 'inactive']).optional(),
});

export type AdminTalentQueryInput = z.infer<typeof adminTalentQuerySchema>;
