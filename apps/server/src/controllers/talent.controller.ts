import { Request, Response } from 'express';
import Talent from '../models/Talent';
import PipelineEntry from '../models/PipelineEntry';
import ApiError from '../utils/ApiError';
import asyncHandler from '../utils/asyncHandler';
import { TalentQueryInput } from '../validators/talent.validators';

// Search talents with filters
export const searchTalents = asyncHandler(async (req: Request, res: Response) => {
  const {
    search,
    roleCategories,
    regions,
    hourlyRateMin,
    hourlyRateMax,
    englishProficiency,
    availability,
    isImmediatelyAvailable,
    yearsOfExperienceMin,
    yearsOfExperienceMax,
    sort = 'newest',
    page = 1,
    limit = 20,
  } = req.validatedQuery as TalentQueryInput;

  const companyId = req.company?.id;

  // Build query filter
  const filter: Record<string, unknown> = { status: 'active' };

  if (search) {
    const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { headline: searchRegex },
      { bio: searchRegex },
      { 'skills.name': searchRegex },
    ];
  }

  if (roleCategories) {
    filter.roleCategories = { $in: roleCategories.split(',') };
  }

  if (regions) {
    filter.region = { $in: regions.split(',') };
  }

  if (hourlyRateMin !== undefined || hourlyRateMax !== undefined) {
    filter.hourlyRate = {};
    if (hourlyRateMin !== undefined) {
      (filter.hourlyRate as Record<string, number>).$gte = hourlyRateMin;
    }
    if (hourlyRateMax !== undefined) {
      (filter.hourlyRate as Record<string, number>).$lte = hourlyRateMax;
    }
  }

  if (englishProficiency) {
    filter.englishProficiency = { $in: englishProficiency.split(',') };
  }

  if (availability) {
    filter.availability = availability;
  }

  if (isImmediatelyAvailable) {
    filter.isImmediatelyAvailable = true;
  }

  if (yearsOfExperienceMin !== undefined || yearsOfExperienceMax !== undefined) {
    filter.yearsOfExperience = {};
    if (yearsOfExperienceMin !== undefined) {
      (filter.yearsOfExperience as Record<string, number>).$gte = yearsOfExperienceMin;
    }
    if (yearsOfExperienceMax !== undefined) {
      (filter.yearsOfExperience as Record<string, number>).$lte = yearsOfExperienceMax;
    }
  }

  // Sort mapping
  const sortMap: Record<string, Record<string, 1 | -1>> = {
    relevance: { createdAt: -1 },
    hourlyRate_asc: { hourlyRate: 1 },
    hourlyRate_desc: { hourlyRate: -1 },
    experience: { yearsOfExperience: -1 },
    newest: { createdAt: -1 },
  };

  const sortOption = sortMap[sort] || { createdAt: -1 as const };

  // Calculate pagination
  const skip = (page - 1) * limit;

  const [talents, total] = await Promise.all([
    Talent.find(filter).sort(sortOption).skip(skip).limit(limit).lean(),
    Talent.countDocuments(filter),
  ]);

  // Get pipeline entries for this company to check isInPipeline
  const talentIds = talents.map((t: { _id: unknown }) => t._id);
  const pipelineEntries = await PipelineEntry.find({
    companyId,
    talentId: { $in: talentIds as any },
  }).select('talentId');

  const talentIdsInPipeline = new Set(pipelineEntries.map((e) => e.talentId.toString()));

  // Add isInPipeline flag to each talent
  const talentsWithFlag = talents.map((talent: { _id: { toString: () => string } }) => ({
    ...talent,
    isInPipeline: talentIdsInPipeline.has(talent._id.toString()),
  }));

  res.status(200).json({
    success: true,
    data: talentsWithFlag,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Get talent by ID
export const getTalentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const companyId = req.company?.id;

  const talent = await Talent.findById(id);

  if (!talent) {
    throw new ApiError(404, 'Talent not found', 'NOT_FOUND');
  }

  // Check if talent is in pipeline for this company
  const pipelineEntry = await PipelineEntry.findOne({
    companyId,
    talentId: id,
  }).populate('jobId', 'title');

  const response = {
    ...talent.toObject(),
    isInPipeline: !!pipelineEntry,
    pipelineJobTitle: pipelineEntry && 'jobId' in pipelineEntry && pipelineEntry.jobId && typeof pipelineEntry.jobId === 'object' && 'title' in pipelineEntry.jobId
      ? (pipelineEntry.jobId as { title: string }).title
      : null,
  };

  res.status(200).json({
    success: true,
    data: response,
  });
});
