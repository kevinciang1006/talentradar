import { z } from 'zod';

export const addToPipelineSchema = z.object({
  jobId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid job ID format'),
  talentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid talent ID format'),
});

export type AddToPipelineInput = z.infer<typeof addToPipelineSchema>;

export const updateStageSchema = z.object({
  stage: z.enum(['shortlisted', 'screening', 'interview', 'offer', 'finalizing', 'hired', 'rejected']),
  note: z.string().max(1000).optional(),
});

export type UpdateStageInput = z.infer<typeof updateStageSchema>;

export const addNoteSchema = z.object({
  content: z.string().min(1, 'Note content is required').max(1000, 'Note must be 1000 characters or less'),
});

export type AddNoteInput = z.infer<typeof addNoteSchema>;

export const assignScreeningTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  dueDate: z.string().datetime('Invalid date format'),
  taskLink: z.string().url('Invalid task link URL').optional().or(z.literal('')),
  submissionLink: z.string().url('Invalid submission link URL').optional().or(z.literal('')),
});

export type AssignScreeningTaskInput = z.infer<typeof assignScreeningTaskSchema>;

export const updateScreeningTaskStatusSchema = z.object({
  status: z.enum(['draft', 'sent', 'submitted', 'reviewed']),
});

export type UpdateScreeningTaskStatusInput = z.infer<typeof updateScreeningTaskStatusSchema>;

export const scheduleInterviewSchema = z.object({
  scheduledAt: z.string().datetime('Invalid date format'),
  candidateTimezone: z.string().min(1, 'Timezone is required'),
  meetingLink: z.string().url('Invalid meeting link'),
  notes: z.string().optional(),
});

export type ScheduleInterviewInput = z.infer<typeof scheduleInterviewSchema>;

export const updateInterviewStatusSchema = z.object({
  status: z.enum(['scheduled', 'completed', 'no_show', 'cancelled']),
  notes: z.string().optional(),
});

export type UpdateInterviewStatusInput = z.infer<typeof updateInterviewStatusSchema>;

export const createOfferSchema = z.object({
  rate: z.number().min(5, 'Rate must be at least $5'),
  hoursPerWeek: z.number().min(20, 'Minimum 20 hours per week').max(60, 'Maximum 60 hours per week'),
  type: z.enum(['full_time', 'part_time']),
  startDate: z.string().datetime('Invalid date format'),
  message: z.string().optional(),
});

export type CreateOfferInput = z.infer<typeof createOfferSchema>;

export const rejectSchema = z.object({
  reason: z.enum([
    'skills_mismatch', 'rate_too_high', 'poor_communication',
    'not_enough_experience', 'no_show', 'chose_another',
    'candidate_declined', 'other',
  ]),
  notes: z.string().optional(),
});

export type RejectInput = z.infer<typeof rejectSchema>;

export const completePaymentSchema = z.object({
  method: z.string().min(1, 'Payment method is required'),
  transactionId: z.string().min(1, 'Transaction ID is required'),
});

export type CompletePaymentInput = z.infer<typeof completePaymentSchema>;

export const signContractSchema = z.object({});

export type SignContractInput = z.infer<typeof signContractSchema>;

export const acceptCounterSchema = z.object({});

export type AcceptCounterInput = z.infer<typeof acceptCounterSchema>;

export const reviseOfferSchema = z.object({
  rate: z.number().min(5, 'Rate must be at least $5'),
  hoursPerWeek: z.number().min(20, 'Minimum 20 hours per week').max(60, 'Maximum 60 hours per week').optional(),
  message: z.string().optional(),
});

export type ReviseOfferInput = z.infer<typeof reviseOfferSchema>;

export const declineCounterSchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
});

export type DeclineCounterInput = z.infer<typeof declineCounterSchema>;
