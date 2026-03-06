import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  roleCategory: z.enum([
    'administrative', 'executive', 'customer_support', 'sales',
    'lead_generation', 'social_media', 'marketing', 'graphic_design',
    'medical', 'legal', 'insurance', 'real_estate',
    'ecommerce', 'bookkeeping_accounting', 'custom',
  ]),
  customRoleName: z.string().optional(),
  description: z.string().min(1, 'Description must be at least 1 characters'),
  requirements: z.string().optional(),
  hourlyRateMin: z.number().min(5, 'Minimum hourly rate must be at least $5'),
  hourlyRateMax: z.number().min(5, 'Maximum hourly rate must be at least $5'),
  availability: z.enum(['full_time', 'part_time']),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;

export const updateJobSchema = createJobSchema.partial();

export type UpdateJobInput = z.infer<typeof updateJobSchema>;
