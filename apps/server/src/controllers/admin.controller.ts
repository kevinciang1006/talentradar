import { Request, Response } from 'express';
import PipelineEntry from '../models/PipelineEntry';
import Company from '../models/Company';
import Talent from '../models/Talent';
import Job from '../models/Job';
import ApiError from '../utils/ApiError';
import asyncHandler from '../utils/asyncHandler';
import { transformDealsForFrontend } from '../utils/dealTransform';
import {
  UpdateOfferStatusInput,
  FlagOfferIssueInput,
  UpdatePaymentStatusInput,
  UpdateContractStatusInput,
  UpdatePayrollStatusInput,
  UpdateComplianceInput,
  AssignCsmInput,
  ConfirmStartDateInput,
} from '../validators/admin.validators';
import { AdminTalentQueryInput } from '../validators/talent.validators';

// Get admin dashboard stats
export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    activeDeals,
    actionRequired,
    hiresThisMonth,
    revenueData,
  ] = await Promise.all([
    // Active deals (in offer or finalizing, not hired/rejected)
    PipelineEntry.countDocuments({
      stage: { $in: ['offer', 'finalizing'] },
    }),

    // Action required (offers sent that need review)
    PipelineEntry.countDocuments({
      $or: [
        { 'offer.status': 'sent' },
        { 'offer.status': 'accepted', stage: 'offer' },
      ],
    }),

    // Hires this month
    PipelineEntry.countDocuments({
      stage: 'hired',
      'stageHistory.changedAt': { $gte: startOfMonth },
      'stageHistory.to': 'hired',
    }),

    // Revenue this month (sum of payments completed this month)
    PipelineEntry.aggregate([
      {
        $match: {
          'finalization.payment.status': 'paid',
          'finalization.payment.paidAt': { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$finalization.payment.amount' },
        },
      },
    ]),
  ]);

  const revenueThisMonth = revenueData.length > 0 ? revenueData[0].total : 0;

  res.status(200).json({
    success: true,
    data: {
      activeDeals,
      actionRequired,
      hiresThisMonth,
      revenueThisMonth,
    },
  });
});

// Get entries that require admin action
export const getActionRequired = asyncHandler(async (req: Request, res: Response) => {
  const entries = await PipelineEntry.find({
    $or: [
      { 'offer.status': 'sent' },
      { 'offer.status': 'accepted', stage: 'offer' },
    ],
  })
    .populate('companyId', 'name email')
    .populate('talentId', 'firstName lastName email avatar')
    .populate('jobId', 'title')
    .sort({ updatedAt: -1 })
    .lean();

  const transformedData = transformDealsForFrontend(entries as any);

  res.status(200).json({
    success: true,
    data: transformedData,
  });
});

// Get all deals (offer/finalizing/hired)
export const getDeals = asyncHandler(async (req: Request, res: Response) => {
  const { stage } = req.query;

  const filter: Record<string, unknown> = {
    stage: { $in: ['offer', 'finalizing', 'hired'] },
  };

  if (stage) {
    filter.stage = stage;
  }

  const deals = await PipelineEntry.find(filter)
    .populate('companyId', 'name email')
    .populate('talentId', 'firstName lastName email avatar hourlyRate')
    .populate('jobId', 'title')
    .sort({ updatedAt: -1 })
    .lean();

  const transformedData = transformDealsForFrontend(deals as any);

  res.status(200).json({
    success: true,
    data: transformedData,
  });
});

// Get deal by ID
export const getDealById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const deal = await PipelineEntry.findById(id)
    .populate('companyId')
    .populate('talentId')
    .populate('jobId');

  if (!deal) {
    throw new ApiError(404, 'Deal not found', 'NOT_FOUND');
  }

  res.status(200).json({
    success: true,
    data: deal,
  });
});

// Update offer status
export const updateOfferStatus = asyncHandler(async (req: Request<{ id: string }, object, UpdateOfferStatusInput>, res: Response) => {
  const { id } = req.params;
  const { status, counterOffer, declineReason } = req.body;

  const entry = await PipelineEntry.findById(id);

  if (!entry || !entry.offer) {
    throw new ApiError(404, 'Offer not found', 'NOT_FOUND');
  }

  entry.offer.status = status;
  entry.offer.respondedAt = new Date();

  if (counterOffer) {
    entry.offer.counterOffer = {
      ...counterOffer,
      createdAt: new Date(),
    };
  }

  if (declineReason) {
    entry.offer.declineReason = declineReason;
  }

  // If accepted, move to finalizing
  if (status === 'accepted') {
    entry.stage = 'finalizing';
    entry.stageHistory.push({
      from: 'offer',
      to: 'finalizing',
      changedAt: new Date(),
      note: 'Offer accepted',
      changedBy: 'admin',
    });

    // Initialize finalization object
    entry.finalization = {
      payment: {
        status: 'pending',
        amount: entry.offer.rate * entry.offer.hoursPerWeek * 4, // Monthly amount estimate
      },
      contract: {
        status: 'pending',
        clientSigned: false,
        candidateSigned: false,
      },
      payroll: {
        status: 'pending',
      },
      compliance: {
        status: 'pending',
        countryRequirementsMet: false,
      },
      csm: {
        status: 'pending',
      },
      startDate: {
        status: 'pending',
      },
    };
  }

  // If declined, move to rejected
  if (status === 'declined') {
    entry.stage = 'rejected';
    entry.stageHistory.push({
      from: 'offer',
      to: 'rejected',
      changedAt: new Date(),
      note: 'Candidate declined offer',
      changedBy: 'admin',
    });
    entry.rejection = {
      reason: 'candidate_declined',
      notes: declineReason,
      rejectedAt: new Date(),
      rejectedAtStage: 'offer',
    };
  }

  await entry.save();

  res.status(200).json({
    success: true,
    data: entry,
  });
});

// Flag offer issue
export const flagOfferIssue = asyncHandler(async (req: Request<{ id: string }, object, FlagOfferIssueInput>, res: Response) => {
  const { id } = req.params;
  const { issueType, details } = req.body;

  const entry = await PipelineEntry.findById(id);

  if (!entry || !entry.offer) {
    throw new ApiError(404, 'Offer not found', 'NOT_FOUND');
  }

  entry.offer.status = 'flagged';
  entry.offer.flagIssue = {
    issueType,
    details,
    flaggedAt: new Date(),
  };

  await entry.save();

  res.status(200).json({
    success: true,
    data: entry,
  });
});

// Update payment status
export const updatePaymentStatus = asyncHandler(async (req: Request<{ id: string }, object, UpdatePaymentStatusInput>, res: Response) => {
  const { id } = req.params;
  const { status, amount, invoiceId, transactionId } = req.body;

  const entry = await PipelineEntry.findById(id);

  if (!entry || !entry.finalization) {
    throw new ApiError(404, 'Finalization not found', 'NOT_FOUND');
  }

  entry.finalization.payment.status = status;
  if (amount !== undefined) entry.finalization.payment.amount = amount;
  if (invoiceId) entry.finalization.payment.invoiceId = invoiceId;
  if (transactionId) entry.finalization.payment.transactionId = transactionId;

  if (status === 'paid') {
    entry.finalization.payment.paidAt = new Date();
  }

  await entry.save();

  res.status(200).json({
    success: true,
    data: entry,
  });
});

// Update contract status
export const updateContractStatus = asyncHandler(async (req: Request<{ id: string }, object, UpdateContractStatusInput>, res: Response) => {
  const { id } = req.params;
  const { status, contractId, clientSigned, candidateSigned } = req.body;

  const entry = await PipelineEntry.findById(id);

  if (!entry || !entry.finalization) {
    throw new ApiError(404, 'Finalization not found', 'NOT_FOUND');
  }

  entry.finalization.contract.status = status;
  if (contractId) entry.finalization.contract.contractId = contractId;
  if (clientSigned !== undefined) entry.finalization.contract.clientSigned = clientSigned;
  if (candidateSigned !== undefined) entry.finalization.contract.candidateSigned = candidateSigned;

  if (status === 'signed' || (clientSigned && candidateSigned)) {
    entry.finalization.contract.status = 'signed';
    entry.finalization.contract.signedAt = new Date();
  }

  await entry.save();

  res.status(200).json({
    success: true,
    data: entry,
  });
});

// Update payroll status
export const updatePayrollStatus = asyncHandler(async (req: Request<{ id: string }, object, UpdatePayrollStatusInput>, res: Response) => {
  const { id } = req.params;
  const { status, partner, reference, firstPayDate } = req.body;

  const entry = await PipelineEntry.findById(id);

  if (!entry || !entry.finalization) {
    throw new ApiError(404, 'Finalization not found', 'NOT_FOUND');
  }

  entry.finalization.payroll.status = status;
  if (partner) entry.finalization.payroll.partner = partner;
  if (reference) entry.finalization.payroll.reference = reference;
  if (firstPayDate) entry.finalization.payroll.firstPayDate = new Date(firstPayDate);

  if (status === 'complete') {
    entry.finalization.payroll.completedAt = new Date();
  }

  await entry.save();

  res.status(200).json({
    success: true,
    data: entry,
  });
});

// Update compliance status
export const updateComplianceStatus = asyncHandler(async (req: Request<{ id: string }, object, UpdateComplianceInput>, res: Response) => {
  const { id } = req.params;
  const { status, taxClassification, countryRequirementsMet } = req.body;

  const entry = await PipelineEntry.findById(id);

  if (!entry || !entry.finalization) {
    throw new ApiError(404, 'Finalization not found', 'NOT_FOUND');
  }

  entry.finalization.compliance.status = status;
  if (taxClassification) {
    entry.finalization.compliance.taxClassification = {
      confirmed: true,
      classification: taxClassification,
    };
  }
  entry.finalization.compliance.countryRequirementsMet = countryRequirementsMet;

  if (status === 'verified') {
    entry.finalization.compliance.verifiedAt = new Date();
  }

  await entry.save();

  res.status(200).json({
    success: true,
    data: entry,
  });
});

// Assign CSM
export const assignCsm = asyncHandler(async (req: Request<{ id: string }, object, AssignCsmInput>, res: Response) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;

  const entry = await PipelineEntry.findById(id);

  if (!entry || !entry.finalization) {
    throw new ApiError(404, 'Finalization not found', 'NOT_FOUND');
  }

  entry.finalization.csm = {
    status: 'assigned',
    name,
    email,
    phone,
    assignedAt: new Date(),
  };

  await entry.save();

  res.status(200).json({
    success: true,
    data: entry,
  });
});

// Confirm start date
export const confirmStartDate = asyncHandler(async (req: Request<{ id: string }, object, ConfirmStartDateInput>, res: Response) => {
  const { id } = req.params;
  const { confirmedDate } = req.body;

  const entry = await PipelineEntry.findById(id);

  if (!entry || !entry.finalization) {
    throw new ApiError(404, 'Finalization not found', 'NOT_FOUND');
  }

  entry.finalization.startDate = {
    status: 'confirmed',
    confirmedDate: new Date(confirmedDate),
    confirmedAt: new Date(),
  };

  await entry.save();

  res.status(200).json({
    success: true,
    data: entry,
  });
});

// Mark as hired (final step)
export const markAsHired = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const entry = await PipelineEntry.findById(id);

  if (!entry || !entry.finalization) {
    throw new ApiError(404, 'Finalization not found', 'NOT_FOUND');
  }

  // Verify all steps are complete
  const incomplete: string[] = [];

  if (entry.finalization.payment.status !== 'paid') incomplete.push('payment');
  if (entry.finalization.contract.status !== 'signed') incomplete.push('contract');
  if (entry.finalization.payroll.status !== 'complete') incomplete.push('payroll');
  if (entry.finalization.compliance.status !== 'verified') incomplete.push('compliance');
  if (entry.finalization.csm.status !== 'assigned') incomplete.push('csm');
  if (entry.finalization.startDate.status !== 'confirmed') incomplete.push('startDate');

  if (incomplete.length > 0) {
    throw new ApiError(
      400,
      `Cannot mark as hired. Incomplete steps: ${incomplete.join(', ')}`,
      'INCOMPLETE_FINALIZATION'
    );
  }

  // Update pipeline entry to hired
  entry.stage = 'hired';
  entry.stageHistory.push({
    from: 'finalizing',
    to: 'hired',
    changedAt: new Date(),
    note: 'All finalization steps complete',
    changedBy: 'admin',
  });

  // Update talent status to hired
  await Talent.findByIdAndUpdate(entry.talentId, { status: 'hired' });

  await entry.save();

  res.status(200).json({
    success: true,
    data: entry,
  });
});

// Get all companies
export const getCompanies = asyncHandler(async (req: Request, res: Response) => {
  const { search } = req.query;

  const filter: Record<string, unknown> = {};

  if (search && typeof search === 'string') {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const companies = await Company.find(filter).sort({ createdAt: -1 });

  // Get stats for each company
  const companiesWithStats = await Promise.all(
    companies.map(async (company) => {
      const [jobCount, pipelineCount, hireCount] = await Promise.all([
        Job.countDocuments({ companyId: company._id }),
        PipelineEntry.countDocuments({ companyId: company._id }),
        PipelineEntry.countDocuments({ companyId: company._id, stage: 'hired' }),
      ]);

      return {
        ...company.toObject(),
        jobCount,
        pipelineCount,
        hireCount,
      };
    })
  );

  res.status(200).json({
    success: true,
    data: companiesWithStats,
  });
});

// Get company by ID
export const getCompanyById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const company = await Company.findById(id);

  if (!company) {
    throw new ApiError(404, 'Company not found', 'NOT_FOUND');
  }

  const [jobs, pipelineActivity, hires] = await Promise.all([
    Job.find({ companyId: id }),
    PipelineEntry.find({ companyId: id })
      .populate('talentId', 'firstName lastName')
      .populate('jobId', 'title')
      .sort({ updatedAt: -1 })
      .limit(20),
    PipelineEntry.find({ companyId: id, stage: 'hired' })
      .populate('talentId', 'firstName lastName avatar')
      .populate('jobId', 'title'),
  ]);

  res.status(200).json({
    success: true,
    data: {
      company,
      jobs,
      pipelineActivity,
      hires,
    },
  });
});

// Get all talents (admin view)
export const getTalentForAdmin = asyncHandler(async (req: Request, res: Response) => {
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
    status,
    sort = 'newest',
    page = 1,
    limit = 20,
  } = req.validatedQuery as AdminTalentQueryInput;

  // Build query filter (same as talent.controller.ts but with status support)
  const filter: Record<string, unknown> = {};

  // Status filter - admin can filter by all statuses
  if (status) {
    filter.status = status;
  }

  // Search implementation - use regex for better partial matching
  if (search) {
    const searchRegex = { $regex: search, $options: 'i' };
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

  // Sort mapping - using simple sorting since we're using regex search
  const sortMap: Record<string, any> = {
    relevance: { createdAt: -1 }, // Default to newest when searching
    hourlyRate_asc: { hourlyRate: 1 },
    hourlyRate_desc: { hourlyRate: -1 },
    experience: { yearsOfExperience: -1 },
    newest: { createdAt: -1 },
  };

  const sortOption = sortMap[sort] || { createdAt: -1 };

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Execute query
  const [talents, total] = await Promise.all([
    Talent.find(filter).sort(sortOption).skip(skip).limit(limit).lean(),
    Talent.countDocuments(filter),
  ]);

  // Calculate pipelineCount for each talent (how many companies have them)
  const talentIds = talents.map((t: { _id: unknown }) => t._id);
  const pipelineCounts = await PipelineEntry.aggregate([
    {
      $match: {
        talentId: { $in: talentIds as any },
        stage: { $nin: ['rejected', 'withdrawn'] }, // Only count active pipeline entries
      },
    },
    {
      $group: {
        _id: '$talentId',
        count: { $sum: 1 },
      },
    },
  ]);

  // Create a map of talentId -> pipelineCount
  const pipelineCountMap = new Map(
    pipelineCounts.map((pc: { _id: any; count: number }) => [pc._id.toString(), pc.count])
  );

  // Add pipelineCount to each talent
  const talentsWithPipelineCount = talents.map((talent: { _id: { toString: () => string } }) => ({
    ...talent,
    pipelineCount: pipelineCountMap.get(talent._id.toString()) || 0,
  }));

  res.status(200).json({
    success: true,
    data: talentsWithPipelineCount,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});
