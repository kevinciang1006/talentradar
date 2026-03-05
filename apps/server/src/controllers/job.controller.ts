import { Request, Response } from 'express';
import Job from '../models/Job';
import PipelineEntry from '../models/PipelineEntry';
import ApiError from '../utils/ApiError';
import asyncHandler from '../utils/asyncHandler';
import { CreateJobInput, UpdateJobInput } from '../validators/job.validators';

// Get all jobs for a company
export const getJobs = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.company?.id;

  const jobs = await Job.find({ companyId }).sort({ createdAt: -1 });

  // Get candidate counts for each job
  const jobIds = jobs.map((job) => job._id);
  const candidateCounts = await PipelineEntry.aggregate([
    { $match: { jobId: { $in: jobIds } } },
    { $group: { _id: '$jobId', count: { $sum: 1 } } },
  ]);

  const countMap = new Map(candidateCounts.map((c) => [c._id.toString(), c.count]));

  const jobsWithCounts = jobs.map((job) => ({
    ...job.toObject(),
    candidateCount: countMap.get(job._id.toString()) || 0,
  })).sort((a, b) => a.title.localeCompare(b.title));

  res.status(200).json({
    success: true,
    data: jobsWithCounts,
  });
});

// Create a new job
export const createJob = asyncHandler(async (req: Request<object, object, CreateJobInput>, res: Response) => {
  const companyId = req.company?.id;

  const job = await Job.create({
    ...req.body,
    companyId,
  });

  res.status(201).json({
    success: true,
    data: job,
  });
});

// Get job by ID
export const getJobById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const companyId = req.company?.id;

  const job = await Job.findById(id);

  if (!job) {
    throw new ApiError(404, 'Job not found', 'NOT_FOUND');
  }

  // Verify ownership
  if (job.companyId.toString() !== companyId) {
    throw new ApiError(403, 'Access denied', 'FORBIDDEN');
  }

  // Get candidate count
  const candidateCount = await PipelineEntry.countDocuments({ jobId: id });

  res.status(200).json({
    success: true,
    data: {
      ...job.toObject(),
      candidateCount,
    },
  });
});

// Update job
export const updateJob = asyncHandler(async (req: Request<{ id: string }, object, UpdateJobInput>, res: Response) => {
  const { id } = req.params;
  const companyId = req.company?.id;

  const job = await Job.findById(id);

  if (!job) {
    throw new ApiError(404, 'Job not found', 'NOT_FOUND');
  }

  // Verify ownership
  if (job.companyId.toString() !== companyId) {
    throw new ApiError(403, 'Access denied', 'FORBIDDEN');
  }

  // Update job
  Object.assign(job, req.body);
  await job.save();

  res.status(200).json({
    success: true,
    data: job,
  });
});

// Delete job
export const deleteJob = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const companyId = req.company?.id;

  const job = await Job.findById(id);

  if (!job) {
    throw new ApiError(404, 'Job not found', 'NOT_FOUND');
  }

  // Verify ownership
  if (job.companyId.toString() !== companyId) {
    throw new ApiError(403, 'Access denied', 'FORBIDDEN');
  }

  // Check if there are any pipeline entries for this job
  const pipelineEntryCount = await PipelineEntry.countDocuments({ jobId: id });

  if (pipelineEntryCount > 0) {
    throw new ApiError(
      409,
      'Cannot delete job with existing pipeline entries',
      'JOB_HAS_CANDIDATES'
    );
  }

  await job.deleteOne();

  res.status(200).json({
    success: true,
    data: { message: 'Job deleted successfully' },
  });
});
