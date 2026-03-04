import { Request, Response } from 'express';
import mongoose from 'mongoose';
import PipelineEntry from '../models/PipelineEntry';
import Job from '../models/Job';
import Talent from '../models/Talent';
import ApiError from '../utils/ApiError';
import asyncHandler from '../utils/asyncHandler';
import {
  AddToPipelineInput,
  UpdateStageInput,
  AddNoteInput,
  AssignScreeningTaskInput,
  UpdateScreeningTaskStatusInput,
  ScheduleInterviewInput,
  UpdateInterviewStatusInput,
  CreateOfferInput,
  RejectInput,
  CompletePaymentInput,
  AcceptCounterInput,
  ReviseOfferInput,
  DeclineCounterInput,
} from '../validators/pipeline.validators';
import { PipelineStage } from '../types';

// Get pipeline entries for a job
export const getPipelineEntries = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.query;
  const companyId = req.company?.id;

  if (!jobId) {
    throw new ApiError(400, 'Job ID is required', 'MISSING_JOB_ID');
  }

  const entries = await PipelineEntry.find({ jobId, companyId })
    .populate('talentId', 'firstName lastName avatar headline hourlyRate region englishProficiency')
    .sort({ createdAt: -1 });

  // Count entries per stage
  const stageCounts = await PipelineEntry.aggregate([
    {
      $match: {
        jobId: new mongoose.Types.ObjectId(jobId as string),
        companyId: new mongoose.Types.ObjectId(companyId as string)
      }
    },
    { $group: { _id: '$stage', count: { $sum: 1 } } },
  ]);

  res.status(200).json({
    success: true,
    data: {
      entries,
      stageCounts: stageCounts.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
    },
  });
});

// Add talent to pipeline
export const addToPipeline = asyncHandler(async (req: Request<object, object, AddToPipelineInput>, res: Response) => {
  const { jobId, talentId } = req.body;
  const companyId = req.company?.id;

  // Verify job belongs to this company
  const job = await Job.findById(jobId);
  if (!job || job.companyId.toString() !== companyId) {
    throw new ApiError(404, 'Job not found', 'NOT_FOUND');
  }

  // Verify talent exists and is active
  const talent = await Talent.findById(talentId);
  if (!talent || talent.status !== 'active') {
    throw new ApiError(404, 'Talent not found or inactive', 'NOT_FOUND');
  }

  // Check for duplicate (unique index will also prevent this)
  const existing = await PipelineEntry.findOne({ talentId, companyId });
  if (existing) {
    throw new ApiError(409, 'Talent already in pipeline for this company', 'DUPLICATE_ENTRY');
  }

  // Create pipeline entry
  const entry = await PipelineEntry.create({
    jobId,
    companyId,
    talentId,
    stage: 'shortlisted',
    stageHistory: [{
      from: null,
      to: 'shortlisted',
      changedAt: new Date(),
      changedBy: 'company',
    }],
    notes: [],
  });

  const populated = await PipelineEntry.findById(entry._id)
    .populate('talentId', 'firstName lastName avatar headline hourlyRate region englishProficiency');

  res.status(201).json({
    success: true,
    data: populated,
  });
});

// Update pipeline stage
export const updateStage = asyncHandler(async (req: Request<{ id: string }, object, UpdateStageInput>, res: Response) => {
  const { id } = req.params;
  const { stage, note } = req.body;
  const companyId = req.company?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || entry.companyId.toString() !== companyId) {
    throw new ApiError(404, 'Pipeline entry not found', 'NOT_FOUND');
  }

  // Validate stage transition
  const validTransitions: Record<PipelineStage, PipelineStage[]> = {
    shortlisted: ['screening', 'rejected'],
    screening: ['interview', 'rejected'],
    interview: ['offer', 'rejected'],
    offer: ['rejected'], // offer status managed separately
    finalizing: ['rejected'],
    hired: [],
    rejected: [],
  };

  if (!validTransitions[entry.stage].includes(stage)) {
    throw new ApiError(400, `Invalid stage transition from ${entry.stage} to ${stage}`, 'INVALID_TRANSITION');
  }

  // Update stage
  entry.stage = stage;
  entry.stageHistory.push({
    from: entry.stage,
    to: stage,
    changedAt: new Date(),
    note,
    changedBy: 'company',
  });

  await entry.save();

  res.status(200).json({
    success: true,
    data: entry,
  });
});

// Add note to pipeline entry
export const addNote = asyncHandler(async (req: Request<{ id: string }, object, AddNoteInput>, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;
  const companyId = req.company?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || entry.companyId.toString() !== companyId) {
    throw new ApiError(404, 'Pipeline entry not found', 'NOT_FOUND');
  }

  entry.notes.push({
    content,
    createdAt: new Date(),
    stage: entry.stage,
    authorType: 'company',
    authorId: companyId as unknown as import('mongoose').Types.ObjectId,
  });

  await entry.save();

  res.status(200).json({
    success: true,
    data: entry,
  });
});

// Delete pipeline entry
export const deletePipelineEntry = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const companyId = req.company?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || entry.companyId.toString() !== companyId) {
    throw new ApiError(404, 'Pipeline entry not found', 'NOT_FOUND');
  }

  await entry.deleteOne();

  res.status(200).json({
    success: true,
    data: { message: 'Pipeline entry deleted successfully' },
  });
});

// Assign screening task
export const assignScreeningTask = asyncHandler(async (req: Request<{ id: string }, object, AssignScreeningTaskInput>, res: Response) => {
  const { id } = req.params;
  const { title, description, dueDate, taskLink, submissionLink } = req.body;
  const companyId = req.company?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || entry.companyId.toString() !== companyId) {
    throw new ApiError(404, 'Pipeline entry not found', 'NOT_FOUND');
  }

  if (entry.stage !== 'screening') {
    throw new ApiError(400, 'Can only assign screening tasks when stage is "screening"', 'INVALID_STAGE');
  }

  entry.screeningTask = {
    title,
    description,
    dueDate: new Date(dueDate),
    status: 'sent',
    taskLink,
    submissionLink,
    createdAt: new Date(),
  };

  await entry.save();

  res.status(200).json({
    success: true,
    data: entry,
  });
});

// Update screening task status
export const updateScreeningTaskStatus = asyncHandler(async (req: Request<{ id: string }, object, UpdateScreeningTaskStatusInput>, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const companyId = req.company?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || entry.companyId.toString() !== companyId) {
    throw new ApiError(404, 'Pipeline entry not found', 'NOT_FOUND');
  }

  if (!entry.screeningTask) {
    throw new ApiError(400, 'No screening task assigned', 'NO_SCREENING_TASK');
  }

  entry.screeningTask.status = status;
  await entry.save();

  res.status(200).json({
    success: true,
    data: entry,
  });
});

// Schedule interview
export const scheduleInterview = asyncHandler(async (req: Request<{ id: string }, object, ScheduleInterviewInput>, res: Response) => {
  const { id } = req.params;
  const { scheduledAt, candidateTimezone, meetingLink, notes } = req.body;
  const companyId = req.company?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || entry.companyId.toString() !== companyId) {
    throw new ApiError(404, 'Pipeline entry not found', 'NOT_FOUND');
  }

  if (entry.stage !== 'interview') {
    throw new ApiError(400, 'Can only schedule interviews when stage is "interview"', 'INVALID_STAGE');
  }

  entry.interview = {
    scheduledAt: new Date(scheduledAt),
    candidateTimezone,
    meetingLink,
    status: 'scheduled',
    notes: notes || '',
  };

  await entry.save();

  res.status(200).json({
    success: true,
    data: entry,
  });
});

// Update interview status
export const updateInterviewStatus = asyncHandler(async (req: Request<{ id: string }, object, UpdateInterviewStatusInput>, res: Response) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const companyId = req.company?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || entry.companyId.toString() !== companyId) {
    throw new ApiError(404, 'Pipeline entry not found', 'NOT_FOUND');
  }

  if (!entry.interview) {
    throw new ApiError(400, 'No interview scheduled', 'NO_INTERVIEW');
  }

  entry.interview.status = status;
  if (notes) {
    entry.interview.notes = notes;
  }
  if (status === 'completed') {
    entry.interview.completedAt = new Date();
  }

  await entry.save();

  res.status(200).json({
    success: true,
    data: entry,
  });
});

// Create offer
export const createOffer = asyncHandler(async (req: Request<{ id: string }, object, CreateOfferInput>, res: Response) => {
  const { id } = req.params;
  const { rate, hoursPerWeek, type, startDate, message } = req.body;
  const companyId = req.company?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || entry.companyId.toString() !== companyId) {
    throw new ApiError(404, 'Pipeline entry not found', 'NOT_FOUND');
  }

  entry.offer = {
    rate,
    hoursPerWeek,
    type,
    startDate: new Date(startDate),
    message: message || '',
    status: 'sent',
    sentAt: new Date(),
  };

  // Auto-change stage to offer if not already
  if (entry.stage !== 'offer') {
    entry.stage = 'offer';
    entry.stageHistory.push({
      from: entry.stage,
      to: 'offer',
      changedAt: new Date(),
      changedBy: 'company',
    });
  }

  await entry.save();

  res.status(200).json({
    success: true,
    data: entry,
  });
});

// Complete payment
export const completePayment = asyncHandler(async (req: Request<{ id: string }, object, CompletePaymentInput>, res: Response) => {
  const { id } = req.params;
  const { method, transactionId } = req.body;
  const companyId = req.company?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || entry.companyId.toString() !== companyId) {
    throw new ApiError(404, 'Pipeline entry not found', 'NOT_FOUND');
  }

  if (entry.stage !== 'finalizing' || !entry.finalization) {
    throw new ApiError(400, 'Invalid stage for payment completion', 'INVALID_STAGE');
  }

  if (entry.finalization.payment.status === 'paid') {
    throw new ApiError(400, 'Payment already completed', 'PAYMENT_COMPLETE');
  }

  entry.finalization.payment.status = 'paid';
  entry.finalization.payment.transactionId = transactionId;
  entry.finalization.payment.paidAt = new Date();

  await entry.save();

  res.status(200).json({
    success: true,
    data: entry,
  });
});

// Sign contract (client side)
export const signContract = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const companyId = req.company?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || entry.companyId.toString() !== companyId) {
    throw new ApiError(404, 'Pipeline entry not found', 'NOT_FOUND');
  }

  if (entry.stage !== 'finalizing' || !entry.finalization) {
    throw new ApiError(400, 'Invalid stage for contract signing', 'INVALID_STAGE');
  }

  entry.finalization.contract.clientSigned = true;

  // If both signed, update status
  if (entry.finalization.contract.candidateSigned) {
    entry.finalization.contract.status = 'signed';
    entry.finalization.contract.signedAt = new Date();
  }

  await entry.save();

  res.status(200).json({
    success: true,
    data: entry,
  });
});

// Reject candidate
export const rejectCandidate = asyncHandler(async (req: Request<{ id: string }, object, RejectInput>, res: Response) => {
  const { id } = req.params;
  const { reason, notes } = req.body;
  const companyId = req.company?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || entry.companyId.toString() !== companyId) {
    throw new ApiError(404, 'Pipeline entry not found', 'NOT_FOUND');
  }

  // Cannot reject if already rejected or hired
  if (entry.stage === 'rejected') {
    throw new ApiError(400, 'Candidate already rejected', 'ALREADY_REJECTED');
  }

  if (entry.stage === 'hired') {
    throw new ApiError(400, 'Cannot reject hired candidate', 'INVALID_STAGE');
  }

  // Store the current stage before rejecting
  const previousStage = entry.stage;

  // Update stage to rejected
  entry.stage = 'rejected';
  entry.stageHistory.push({
    from: previousStage,
    to: 'rejected',
    changedAt: new Date(),
    note: notes,
    changedBy: 'company',
  });

  // Add rejection details
  entry.rejection = {
    reason,
    notes,
    rejectedAt: new Date(),
    rejectedAtStage: previousStage,
  };

  await entry.save();

  const populated = await PipelineEntry.findById(entry._id)
    .populate('talentId', 'firstName lastName avatar headline hourlyRate region englishProficiency');

  res.status(200).json({
    success: true,
    data: populated,
  });
});

// Accept counter-offer
export const acceptCounterOffer = asyncHandler(async (req: Request<{ id: string }, object, AcceptCounterInput>, res: Response) => {
  const { id } = req.params;
  const companyId = req.company?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || entry.companyId.toString() !== companyId) {
    throw new ApiError(404, 'Pipeline entry not found', 'NOT_FOUND');
  }

  if (!entry.offer || entry.offer.status !== 'negotiating') {
    throw new ApiError(400, 'No active counter-offer to accept', 'INVALID_STATE');
  }

  // Get latest counter-offer from negotiation history
  const latestCounter = entry.offer.negotiationHistory
    ?.filter((r) => r.actor === 'candidate')
    ?.sort((a, b) => b.round - a.round)[0];

  if (!latestCounter) {
    throw new ApiError(400, 'No counter-offer found in negotiation history', 'NO_COUNTER');
  }

  // Update offer terms to match counter
  entry.offer.rate = latestCounter.rate;
  if (latestCounter.hoursPerWeek) {
    entry.offer.hoursPerWeek = latestCounter.hoursPerWeek;
  }

  // Add to negotiation history
  const newRound = (latestCounter.round || 0) + 1;
  if (!entry.offer.negotiationHistory) {
    entry.offer.negotiationHistory = [];
  }
  entry.offer.negotiationHistory.push({
    round: newRound,
    actor: 'company',
    action: 'accepted_counter',
    rate: latestCounter.rate,
    hoursPerWeek: latestCounter.hoursPerWeek,
    message: 'Hiring manager accepted the counter-offer',
    createdAt: new Date(),
  });

  // Send back to admin for approval
  entry.offer.status = 'pending_approval';
  entry.offer.approvedByAdmin = false;

  // Timeline event
  entry.timeline.push({
    date: new Date(),
    event: `Company accepted counter-offer: $${latestCounter.rate}/hr`,
    actorType: 'company',
    actorId: new mongoose.Types.ObjectId(companyId),
  });

  await entry.save();

  const populated = await PipelineEntry.findById(entry._id)
    .populate('talentId', 'firstName lastName avatar headline hourlyRate region englishProficiency');

  res.status(200).json({
    success: true,
    data: populated,
  });
});

// Revise offer during negotiation
export const reviseOffer = asyncHandler(async (req: Request<{ id: string }, object, ReviseOfferInput>, res: Response) => {
  const { id } = req.params;
  const { rate, hoursPerWeek, message } = req.body;
  const companyId = req.company?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || entry.companyId.toString() !== companyId) {
    throw new ApiError(404, 'Pipeline entry not found', 'NOT_FOUND');
  }

  if (!entry.offer || entry.offer.status !== 'negotiating') {
    throw new ApiError(400, 'Offer is not in negotiation state', 'INVALID_STATE');
  }

  // Get current max round
  const maxRound = Math.max(
    0,
    ...(entry.offer.negotiationHistory || []).map((r) => r.round)
  );
  const newRound = maxRound + 1;

  // Add revised offer to negotiation history
  if (!entry.offer.negotiationHistory) {
    entry.offer.negotiationHistory = [];
  }
  entry.offer.negotiationHistory.push({
    round: newRound,
    actor: 'company',
    action: 'revised_offer',
    rate,
    hoursPerWeek: hoursPerWeek || entry.offer.hoursPerWeek,
    message: message || '',
    createdAt: new Date(),
  });

  // Update offer terms
  entry.offer.rate = rate;
  if (hoursPerWeek) {
    entry.offer.hoursPerWeek = hoursPerWeek;
  }
  if (message) {
    entry.offer.message = message;
  }

  // Send to admin for approval
  entry.offer.status = 'pending_approval';
  entry.offer.approvedByAdmin = false;

  // Timeline event
  entry.timeline.push({
    date: new Date(),
    event: `Company revised offer: $${rate}/hr`,
    actorType: 'company',
    actorId: new mongoose.Types.ObjectId(companyId),
  });

  await entry.save();

  const populated = await PipelineEntry.findById(entry._id)
    .populate('talentId', 'firstName lastName avatar headline hourlyRate region englishProficiency');

  res.status(200).json({
    success: true,
    data: populated,
  });
});

// Decline counter-offer
export const declineCounterOffer = asyncHandler(async (req: Request<{ id: string }, object, DeclineCounterInput>, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const companyId = req.company?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || entry.companyId.toString() !== companyId) {
    throw new ApiError(404, 'Pipeline entry not found', 'NOT_FOUND');
  }

  if (!entry.offer || entry.offer.status !== 'negotiating') {
    throw new ApiError(400, 'No active negotiation to decline', 'INVALID_STATE');
  }

  // Get current max round
  const maxRound = Math.max(0, ...(entry.offer.negotiationHistory || []).map((r) => r.round));
  const newRound = maxRound + 1;

  // Add decline to negotiation history
  if (!entry.offer.negotiationHistory) {
    entry.offer.negotiationHistory = [];
  }
  entry.offer.negotiationHistory.push({
    round: newRound,
    actor: 'company',
    action: 'declined_counter',
    rate: entry.offer.rate,
    message: reason || 'Counter-offer declined',
    createdAt: new Date(),
  });

  // Update offer status and stage
  entry.offer.status = 'declined';
  entry.offer.declineReason = reason;
  entry.stage = 'rejected';

  // Stage history
  entry.stageHistory.push({
    from: entry.stage === 'rejected' ? 'offer' : entry.stage,
    to: 'rejected',
    changedAt: new Date(),
    note: 'Counter-offer declined',
    changedBy: 'company',
  });

  // Timeline event
  entry.timeline.push({
    date: new Date(),
    event: 'Company declined counter-offer',
    actorType: 'company',
    actorId: new mongoose.Types.ObjectId(companyId),
  });

  await entry.save();

  const populated = await PipelineEntry.findById(entry._id)
    .populate('talentId', 'firstName lastName avatar headline hourlyRate region englishProficiency');

  res.status(200).json({
    success: true,
    data: populated,
  });
});

// Get negotiation history
export const getNegotiationHistory = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const companyId = req.company?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || entry.companyId.toString() !== companyId) {
    throw new ApiError(404, 'Pipeline entry not found', 'NOT_FOUND');
  }

  res.status(200).json({
    success: true,
    data: entry.offer?.negotiationHistory || [],
  });
});
