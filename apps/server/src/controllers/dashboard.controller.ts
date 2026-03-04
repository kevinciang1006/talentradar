import { Request, Response } from 'express';
import PipelineEntry from '../models/PipelineEntry';
import asyncHandler from '../utils/asyncHandler';

// Get dashboard stats
export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.company?.id;

  const [
    totalShortlisted,
    inPipeline,
    interviews,
    totalHired,
    finalizing,
  ] = await Promise.all([
    // Total shortlisted (all entries ever created)
    PipelineEntry.countDocuments({ companyId }),

    // In pipeline (not hired or rejected)
    PipelineEntry.countDocuments({
      companyId,
      stage: { $nin: ['hired', 'rejected'] },
    }),

    // Scheduled interviews
    PipelineEntry.countDocuments({
      companyId,
      stage: 'interview',
      'interview.status': 'scheduled',
    }),

    // Total hired
    PipelineEntry.countDocuments({
      companyId,
      stage: 'hired',
    }),

    // Finalizing
    PipelineEntry.countDocuments({
      companyId,
      stage: 'finalizing',
    }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalShortlisted,
      inPipeline,
      interviews,
      totalHired,
      finalizing,
    },
  });
});

// Get upcoming interviews
export const getUpcomingInterviews = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.company?.id;

  const entries = await PipelineEntry.find({
    companyId,
    stage: 'interview',
    'interview.status': 'scheduled',
    'interview.scheduledAt': { $gte: new Date() },
  })
    .populate('talentId', 'firstName lastName avatar headline')
    .populate('jobId', 'title')
    .sort({ 'interview.scheduledAt': 1 })
    .limit(5);

  res.status(200).json({
    success: true,
    data: entries,
  });
});

// Get active offers
export const getActiveOffers = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.company?.id;

  const entries = await PipelineEntry.find({
    companyId,
    stage: 'offer',
    'offer.status': { $in: ['sent', 'under_review', 'presented', 'negotiating'] },
  })
    .populate('talentId', 'firstName lastName avatar headline hourlyRate')
    .populate('jobId', 'title')
    .sort({ 'offer.sentAt': -1 });

  res.status(200).json({
    success: true,
    data: entries,
  });
});

// Get recent activity
export const getRecentActivity = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.company?.id;

  const entries = await PipelineEntry.find({ companyId })
    .populate('talentId', 'firstName lastName')
    .populate('jobId', 'title')
    .sort({ updatedAt: -1 })
    .limit(10);

  // Flatten stageHistory and get latest changes
  const recentActivity = entries.flatMap((entry) => {
    const talent = entry.talentId as unknown as { firstName: string; lastName: string };
    const job = entry.jobId as unknown as { title: string };

    return entry.stageHistory.map((change) => ({
      talentName: `${talent.firstName} ${talent.lastName}`,
      jobTitle: job.title,
      from: change.from,
      to: change.to,
      changedAt: change.changedAt,
      note: change.note,
      changedBy: change.changedBy,
    }));
  })
    .sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime())
    .slice(0, 10);

  res.status(200).json({
    success: true,
    data: recentActivity,
  });
});
