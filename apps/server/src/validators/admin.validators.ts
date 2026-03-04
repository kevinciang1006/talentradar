import { z } from 'zod';

export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export const updateOfferStatusSchema = z.object({
  status: z.enum(['sent', 'under_review', 'presented', 'accepted', 'negotiating', 'declined', 'withdrawn', 'flagged']),
  counterOffer: z.object({
    rate: z.number().min(5, 'Rate must be at least $5'),
    message: z.string().min(1, 'Message is required'),
  }).optional(),
  declineReason: z.string().optional(),
});

export type UpdateOfferStatusInput = z.infer<typeof updateOfferStatusSchema>;

export const flagOfferIssueSchema = z.object({
  issueType: z.string().min(1, 'Issue type is required'),
  details: z.string().min(1, 'Details are required'),
});

export type FlagOfferIssueInput = z.infer<typeof flagOfferIssueSchema>;

export const updatePaymentStatusSchema = z.object({
  status: z.enum(['pending', 'invoiced', 'paid']),
  amount: z.number().positive().optional(),
  invoiceId: z.string().optional(),
  transactionId: z.string().optional(),
});

export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;

export const updateContractStatusSchema = z.object({
  status: z.enum(['pending', 'generated', 'sent', 'signed']),
  contractId: z.string().optional(),
  clientSigned: z.boolean().optional(),
  candidateSigned: z.boolean().optional(),
});

export type UpdateContractStatusInput = z.infer<typeof updateContractStatusSchema>;

export const updatePayrollStatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'complete']),
  partner: z.string().optional(),
  reference: z.string().optional(),
  firstPayDate: z.string().datetime().optional(),
});

export type UpdatePayrollStatusInput = z.infer<typeof updatePayrollStatusSchema>;

export const updateComplianceSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'verified']),
  taxClassification: z.string().optional(),
  countryRequirementsMet: z.boolean(),
});

export type UpdateComplianceInput = z.infer<typeof updateComplianceSchema>;

export const assignCsmSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(1, 'Phone is required'),
});

export type AssignCsmInput = z.infer<typeof assignCsmSchema>;

export const confirmStartDateSchema = z.object({
  confirmedDate: z.string().datetime('Invalid date format'),
});

export type ConfirmStartDateInput = z.infer<typeof confirmStartDateSchema>;

export const markAsHiredSchema = z.object({});

export type MarkAsHiredInput = z.infer<typeof markAsHiredSchema>;
