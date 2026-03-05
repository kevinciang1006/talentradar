import { Request, Response } from 'express';
import mongoose from 'mongoose';
import PipelineEntry from '../models/PipelineEntry';
import ApiError from '../utils/ApiError';
import asyncHandler from '../utils/asyncHandler';
import {
  transformDealForFrontend,
  transformDealsForFrontend,
  isFinalizationComplete,
  getIncompleteSteps,
} from '../utils/dealTransform';
import { formatFileSize, isUsingCloudinary } from '../middleware/upload.middleware';
import { uploadToCloudinary } from '../utils/cloudinary';
import {
  ApproveOfferInput,
  PresentOfferInput,
  FlagOfferInput,
  CandidateResponseInput,
  GenerateInvoiceInput,
  PaymentReceivedInput,
  GenerateContractInput,
  SendContractInput,
  SignContractInput,
  SetupPayrollInput,
  VerifyComplianceInput,
  AssignCsmInput,
  ConfirmStartDateInput,
  AddNoteInput,
} from '../validators/admin.deals.validators';

// ============================================
// DEAL LISTING & RETRIEVAL
// ============================================

export const getDeals = asyncHandler(async (req: Request, res: Response) => {
  const { stage, search, page = '1', limit = '50' } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build filter
  const filter: any = {
    stage: { $in: ['offer', 'finalizing', 'hired'] } // Only deal-related stages
  };

  // Filter by frontend stage (requires mapping)
  if (stage) {
    const stageMap: Record<string, any> = {
      new_offers: { stage: 'offer', 'offer.status': { $in: ['sent', 'pending_approval', 'flagged'] } },
      presented: { stage: 'offer', 'offer.status': { $in: ['presented', 'under_review', 'negotiating'] } },
      accepted: { stage: 'offer', 'offer.status': 'accepted' },
      in_progress: { stage: 'finalizing' },
      completed: { stage: 'hired' },
    };

    const stageFilter = stageMap[stage as string];
    if (stageFilter) {
      Object.assign(filter, stageFilter);
    }
  }

  // Search filter (company name, talent name, job title)
  if (search) {
    // Note: This requires populated fields, so we'll filter after population
  }

  const [entries, total] = await Promise.all([
    PipelineEntry.find(filter)
      .populate('companyId', 'name email')
      .populate('talentId', 'firstName lastName email avatar region')
      .populate('jobId', 'title')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    PipelineEntry.countDocuments(filter),
  ]);

  const deals = transformDealsForFrontend(entries as any);

  res.status(200).json({
    success: true,
    data: deals,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

export const getDealStats = asyncHandler(async (req: Request, res: Response) => {
  // Count by frontend stages
  const stats = await PipelineEntry.aggregate([
    {
      $match: {
        stage: { $in: ['offer', 'finalizing', 'hired'] }
      }
    },
    {
      $group: {
        _id: {
          stage: '$stage',
          offerStatus: '$offer.status'
        },
        count: { $sum: 1 }
      }
    }
  ]);

  // Map to frontend stages
  const stageCounts = {
    new_offers: 0,
    presented: 0,
    accepted: 0,
    in_progress: 0,
    completed: 0,
  };

  stats.forEach((stat) => {
    const { stage, offerStatus } = stat._id;

    if (stage === 'hired') {
      stageCounts.completed += stat.count;
    } else if (stage === 'finalizing') {
      stageCounts.in_progress += stat.count;
    } else if (stage === 'offer') {
      if (['sent', 'pending_approval', 'flagged'].includes(offerStatus)) {
        stageCounts.new_offers += stat.count;
      } else if (['presented', 'under_review', 'negotiating'].includes(offerStatus)) {
        stageCounts.presented += stat.count;
      } else if (offerStatus === 'accepted') {
        stageCounts.accepted += stat.count;
      }
    }
  });

  res.status(200).json({
    success: true,
    data: stageCounts,
  });
});

export const getDealById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const entry = await PipelineEntry.findById(id)
    .populate('companyId', 'name email')
    .populate('talentId', 'firstName lastName email avatar region')
    .populate('jobId', 'title')
    .lean();

  if (!entry) {
    throw new ApiError(404, 'Deal not found', 'NOT_FOUND');
  }

  const deal = transformDealForFrontend(entry as any);

  res.status(200).json({
    success: true,
    data: deal,
  });
});

export const getDealTimeline = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const entry = await PipelineEntry.findById(id).select('timeline').lean();

  if (!entry) {
    throw new ApiError(404, 'Deal not found', 'NOT_FOUND');
  }

  res.status(200).json({
    success: true,
    data: entry.timeline || [],
  });
});

// ============================================
// OFFER MANAGEMENT
// ============================================

export const approveOffer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const adminId = req.admin?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || !entry.offer) {
    throw new ApiError(404, 'Deal or offer not found', 'NOT_FOUND');
  }

  if (entry.offer.approvedByAdmin) {
    throw new ApiError(400, 'Offer already approved', 'OFFER_ALREADY_APPROVED');
  }

  // Update offer
  entry.offer.approvedByAdmin = true;
  entry.offer.approvedAt = new Date();

  // Add timeline event
  entry.timeline.push({
    date: new Date(),
    event: `Offer approved by admin`,
    actorType: 'admin',
    actorId: new mongoose.Types.ObjectId(adminId),
  });

  await entry.save();

  const deal = transformDealForFrontend(entry);

  res.status(200).json({
    success: true,
    data: deal,
  });
});

export const presentOffer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { presentedAt } = req.body as PresentOfferInput;
  const adminId = req.admin?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || !entry.offer) {
    throw new ApiError(404, 'Deal or offer not found', 'NOT_FOUND');
  }

  if (!entry.offer.approvedByAdmin) {
    throw new ApiError(400, 'Offer must be approved before presenting', 'OFFER_NOT_APPROVED');
  }

  // Update offer status
  entry.offer.status = 'presented';
  entry.offer.presentedAt = presentedAt ? new Date(presentedAt) : new Date();

  // Add timeline event
  entry.timeline.push({
    date: new Date(),
    event: `Offer presented to candidate`,
    actorType: 'admin',
    actorId: new mongoose.Types.ObjectId(adminId),
  });

  await entry.save();

  const deal = transformDealForFrontend(entry);

  res.status(200).json({
    success: true,
    data: deal,
  });
});

export const flagOffer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { issueType, details } = req.body as FlagOfferInput;
  const adminId = req.admin?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || !entry.offer) {
    throw new ApiError(404, 'Deal or offer not found', 'NOT_FOUND');
  }

  // Update offer
  entry.offer.status = 'flagged';
  entry.offer.flagIssue = {
    issueType,
    details,
    flaggedAt: new Date(),
  };

  // Add timeline event
  entry.timeline.push({
    date: new Date(),
    event: `Issue flagged: ${issueType}`,
    actorType: 'admin',
    actorId: new mongoose.Types.ObjectId(adminId),
  });

  await entry.save();

  const deal = transformDealForFrontend(entry);

  res.status(200).json({
    success: true,
    data: deal,
  });
});

export const unflagOffer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const adminId = req.admin?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || !entry.offer) {
    throw new ApiError(404, 'Deal or offer not found', 'NOT_FOUND');
  }

  // Reset to pending approval
  entry.offer.status = 'pending_approval';
  entry.offer.flagIssue = undefined;

  // Add timeline event
  entry.timeline.push({
    date: new Date(),
    event: `Issue resolved, offer unflagged`,
    actorType: 'admin',
    actorId: new mongoose.Types.ObjectId(adminId),
  });

  await entry.save();

  const deal = transformDealForFrontend(entry);

  res.status(200).json({
    success: true,
    data: deal,
  });
});

export const recordCandidateResponse = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { response, counterRate, counterHours, counterMessage, declineReason, declineNotes } = req.body as CandidateResponseInput;
  const adminId = req.admin?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || !entry.offer) {
    throw new ApiError(404, 'Deal or offer not found', 'NOT_FOUND');
  }

  // Update based on response type
  if (response === 'accepted') {
    entry.offer.status = 'accepted';
    entry.offer.respondedAt = new Date();

    // Initialize finalization when accepted
    entry.stage = 'finalizing';
    entry.finalization = {
      payment: { status: 'pending' },
      contract: { status: 'pending', clientSigned: false, candidateSigned: false },
      payroll: { status: 'pending' },
      compliance: { status: 'pending', countryRequirementsMet: false },
      csm: { status: 'pending' },
      startDate: { status: 'pending' },
    };

    entry.timeline.push({
      date: new Date(),
      event: `Offer accepted by candidate`,
      actorType: 'admin',
      actorId: new mongoose.Types.ObjectId(adminId),
    });

  } else if (response === 'negotiating') {
    entry.offer.status = 'negotiating';
    entry.offer.respondedAt = new Date();

    // Initialize negotiation history if not exists
    if (!entry.offer.negotiationHistory) {
      entry.offer.negotiationHistory = [];
      // Add initial offer as round 1 retroactively
      entry.offer.negotiationHistory.push({
        round: 1,
        actor: 'company',
        action: 'initial_offer',
        rate: entry.offer.rate,
        hoursPerWeek: entry.offer.hoursPerWeek,
        message: entry.offer.message,
        createdAt: entry.offer.sentAt,
        approvedByAdmin: true,
        presentedAt: entry.offer.presentedAt,
      });
    }

    // Get current max round
    const maxRound = Math.max(...entry.offer.negotiationHistory.map((r) => r.round));

    // Add counter-offer to negotiation history
    if (counterRate) {
      entry.offer.negotiationHistory.push({
        round: maxRound + 1,
        actor: 'candidate',
        action: 'counter_offer',
        rate: counterRate,
        hoursPerWeek: counterHours || entry.offer.hoursPerWeek,
        message: counterMessage || '',
        createdAt: new Date(),
      });

      // Keep legacy counterOffer for backwards compatibility
      entry.offer.counterOffer = {
        rate: counterRate,
        message: counterMessage || '',
        createdAt: new Date(),
      };
    }

    entry.timeline.push({
      date: new Date(),
      event: `Counter-offer received: $${counterRate}/hr`,
      actorType: 'admin',
      actorId: new mongoose.Types.ObjectId(adminId),
    });

  } else if (response === 'declined') {
    entry.offer.status = 'declined';
    entry.offer.respondedAt = new Date();
    entry.offer.declineReason = declineReason;
    entry.offer.declineNotes = declineNotes;

    entry.timeline.push({
      date: new Date(),
      event: `Offer declined by candidate: ${declineReason || 'No reason provided'}`,
      actorType: 'admin',
      actorId: new mongoose.Types.ObjectId(adminId),
    });
  }

  await entry.save();

  const deal = transformDealForFrontend(entry);

  res.status(200).json({
    success: true,
    data: deal,
  });
});

// ============================================
// FINALIZATION: INVOICE & PAYMENT
// ============================================

export const generateInvoice = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount, description } = req.body as GenerateInvoiceInput;
  const adminId = req.admin?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || !entry.finalization) {
    throw new ApiError(404, 'Deal or finalization not found', 'NOT_FOUND');
  }

  // Auto-generate invoice ID
  const year = new Date().getFullYear();
  const count = await PipelineEntry.countDocuments({
    'finalization.payment.invoiceId': { $exists: true, $nin: [null, ''] }
  });
  const invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;

  // Update invoice
  entry.finalization.payment.status = 'invoiced';
  entry.finalization.payment.amount = amount;
  entry.finalization.payment.invoiceId = invoiceNumber;

  // Add timeline event
  entry.timeline.push({
    date: new Date(),
    event: `Invoice generated: ${invoiceNumber} ($${amount})`,
    actorType: 'admin',
    actorId: new mongoose.Types.ObjectId(adminId),
  });

  await entry.save();

  const deal = transformDealForFrontend(entry);

  res.status(200).json({
    success: true,
    data: deal,
  });
});

export const uploadInvoice = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const file = req.file;
  const adminId = req.admin?.id;

  if (!file) {
    throw new ApiError(400, 'No file uploaded', 'FILE_UPLOAD_FAILED');
  }

  if (!id || typeof id !== 'string') {
    throw new ApiError(400, 'Invalid deal ID', 'INVALID_ID');
  }

  const entry = await PipelineEntry.findById(id);

  if (!entry || !entry.finalization) {
    throw new ApiError(404, 'Deal or finalization not found', 'NOT_FOUND');
  }

  // Upload to Cloudinary if configured, otherwise use local storage
  let fileUrl: string;

  if (isUsingCloudinary) {
    // Upload to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(file, id, 'invoices');
    fileUrl = cloudinaryResult.secure_url;
  } else {
    // Local storage (fallback for development)
    fileUrl = `/api/v1/files/${id}/invoices/${file.filename}`;
  }

  // Store file metadata
  entry.finalization.payment.invoiceFile = {
    name: file.originalname,
    size: file.size,
    uploadedAt: new Date(),
    url: fileUrl,
    mimeType: file.mimetype,
  };

  // Add timeline event
  entry.timeline.push({
    date: new Date(),
    event: `Invoice file uploaded: ${file.originalname}`,
    actorType: 'admin',
    actorId: new mongoose.Types.ObjectId(adminId),
  });

  await entry.save();

  res.status(200).json({
    success: true,
    data: {
      file: entry.finalization.payment.invoiceFile,
    },
  });
});

export const recordPayment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { transactionId, amount, method, paidAt } = req.body as PaymentReceivedInput;
  const adminId = req.admin?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || !entry.finalization) {
    throw new ApiError(404, 'Deal or finalization not found', 'NOT_FOUND');
  }

  // Update payment
  entry.finalization.payment.status = 'paid';
  entry.finalization.payment.transactionId = transactionId;
  // Only update amount if provided (otherwise use amount from invoice generation)
  if (amount !== undefined) {
    entry.finalization.payment.amount = amount;
  }
  entry.finalization.payment.method = method;
  entry.finalization.payment.paidAt = paidAt ? new Date(paidAt) : new Date();

  const finalAmount = entry.finalization.payment.amount || 0;

  // Add timeline event
  entry.timeline.push({
    date: new Date(),
    event: `Payment received: $${finalAmount} (${transactionId})`,
    actorType: 'admin',
    actorId: new mongoose.Types.ObjectId(adminId),
  });

  await entry.save();

  const deal = transformDealForFrontend(entry);

  res.status(200).json({
    success: true,
    data: deal,
  });
});

// ============================================
// FINALIZATION: CONTRACT
// ============================================

export const generateContract = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const adminId = req.admin?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || !entry.finalization) {
    throw new ApiError(404, 'Deal or finalization not found', 'NOT_FOUND');
  }

  // Auto-generate contract ID
  const year = new Date().getFullYear();
  const count = await PipelineEntry.countDocuments({
    'finalization.contract.contractId': { $exists: true, $nin: [null, ''] }
  });
  const contractId = `CTR-${year}-${String(count + 1).padStart(4, '0')}`;

  // Update contract
  entry.finalization.contract.status = 'generated';
  entry.finalization.contract.contractId = contractId;

  // Add timeline event
  entry.timeline.push({
    date: new Date(),
    event: `Contract generated: ${contractId}`,
    actorType: 'admin',
    actorId: new mongoose.Types.ObjectId(adminId),
  });

  await entry.save();

  const deal = transformDealForFrontend(entry);

  res.status(200).json({
    success: true,
    data: deal,
  });
});

export const uploadContract = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const file = req.file;
  const adminId = req.admin?.id;

  if (!file) {
    throw new ApiError(400, 'No file uploaded', 'FILE_UPLOAD_FAILED');
  }

  if (!id || typeof id !== 'string') {
    throw new ApiError(400, 'Invalid deal ID', 'INVALID_ID');
  }

  const entry = await PipelineEntry.findById(id);

  if (!entry || !entry.finalization) {
    throw new ApiError(404, 'Deal or finalization not found', 'NOT_FOUND');
  }

  // Upload to Cloudinary if configured, otherwise use local storage
  let fileUrl: string;

  if (isUsingCloudinary) {
    // Upload to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(file, id, 'contracts');
    fileUrl = cloudinaryResult.secure_url;
  } else {
    // Local storage (fallback for development)
    fileUrl = `/api/v1/files/${id}/contracts/${file.filename}`;
  }

  // Store file metadata
  entry.finalization.contract.contractFile = {
    name: file.originalname,
    size: file.size,
    uploadedAt: new Date(),
    url: fileUrl,
    mimeType: file.mimetype,
  };

  // Add timeline event
  entry.timeline.push({
    date: new Date(),
    event: `Contract file uploaded: ${file.originalname}`,
    actorType: 'admin',
    actorId: new mongoose.Types.ObjectId(adminId),
  });

  await entry.save();

  res.status(200).json({
    success: true,
    data: {
      file: entry.finalization.contract.contractFile,
    },
  });
});

export const sendContractToClient = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const adminId = req.admin?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || !entry.finalization) {
    throw new ApiError(404, 'Deal or finalization not found', 'NOT_FOUND');
  }

  entry.finalization.contract.sentToClient = true;
  entry.finalization.contract.status = 'sent';

  entry.timeline.push({
    date: new Date(),
    event: `Contract sent to client`,
    actorType: 'admin',
    actorId: new mongoose.Types.ObjectId(adminId),
  });

  await entry.save();

  const deal = transformDealForFrontend(entry);

  res.status(200).json({
    success: true,
    data: deal,
  });
});

export const sendContractToCandidate = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const adminId = req.admin?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || !entry.finalization) {
    throw new ApiError(404, 'Deal or finalization not found', 'NOT_FOUND');
  }

  entry.finalization.contract.sentToCandidate = true;
  entry.finalization.contract.status = 'sent';

  entry.timeline.push({
    date: new Date(),
    event: `Contract sent to candidate`,
    actorType: 'admin',
    actorId: new mongoose.Types.ObjectId(adminId),
  });

  await entry.save();

  const deal = transformDealForFrontend(entry);

  res.status(200).json({
    success: true,
    data: deal,
  });
});

export const markClientSigned = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { signedAt } = req.body as SignContractInput;
  const adminId = req.admin?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || !entry.finalization) {
    throw new ApiError(404, 'Deal or finalization not found', 'NOT_FOUND');
  }

  entry.finalization.contract.clientSigned = true;

  // Check if both parties signed
  if (entry.finalization.contract.candidateSigned) {
    entry.finalization.contract.status = 'signed';
    entry.finalization.contract.signedAt = signedAt ? new Date(signedAt) : new Date();

    entry.timeline.push({
      date: new Date(),
      event: `Contract fully signed by both parties`,
      actorType: 'admin',
      actorId: new mongoose.Types.ObjectId(adminId),
    });
  } else {
    entry.timeline.push({
      date: new Date(),
      event: `Contract signed by client`,
      actorType: 'admin',
      actorId: new mongoose.Types.ObjectId(adminId),
    });
  }

  await entry.save();

  const deal = transformDealForFrontend(entry);

  res.status(200).json({
    success: true,
    data: deal,
  });
});

export const markCandidateSigned = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { signedAt } = req.body as SignContractInput;
  const adminId = req.admin?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || !entry.finalization) {
    throw new ApiError(404, 'Deal or finalization not found', 'NOT_FOUND');
  }

  entry.finalization.contract.candidateSigned = true;

  // Check if both parties signed
  if (entry.finalization.contract.clientSigned) {
    entry.finalization.contract.status = 'signed';
    entry.finalization.contract.signedAt = signedAt ? new Date(signedAt) : new Date();

    entry.timeline.push({
      date: new Date(),
      event: `Contract fully signed by both parties`,
      actorType: 'admin',
      actorId: new mongoose.Types.ObjectId(adminId),
    });
  } else {
    entry.timeline.push({
      date: new Date(),
      event: `Contract signed by candidate`,
      actorType: 'admin',
      actorId: new mongoose.Types.ObjectId(adminId),
    });
  }

  await entry.save();

  const deal = transformDealForFrontend(entry);

  res.status(200).json({
    success: true,
    data: deal,
  });
});

// ============================================
// FINALIZATION: PAYROLL
// ============================================

export const setupPayroll = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { partner, reference, bankDetailsCollected, scheduleConfigured, firstPayDate, notes } = req.body as SetupPayrollInput;
  const adminId = req.admin?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || !entry.finalization) {
    throw new ApiError(404, 'Deal or finalization not found', 'NOT_FOUND');
  }

  // Update payroll
  entry.finalization.payroll.partner = partner;
  entry.finalization.payroll.reference = reference;
  entry.finalization.payroll.bankDetailsCollected = bankDetailsCollected;
  entry.finalization.payroll.scheduleConfigured = scheduleConfigured;
  entry.finalization.payroll.notes = notes;

  if (firstPayDate) {
    entry.finalization.payroll.firstPayDate = new Date(firstPayDate);
  }

  // Mark as complete if key fields are set
  if (partner && (bankDetailsCollected || scheduleConfigured)) {
    entry.finalization.payroll.status = 'complete';
    entry.finalization.payroll.completedAt = new Date();

    entry.timeline.push({
      date: new Date(),
      event: `Payroll setup complete with ${partner}`,
      actorType: 'admin',
      actorId: new mongoose.Types.ObjectId(adminId),
    });
  } else {
    entry.finalization.payroll.status = 'in_progress';

    entry.timeline.push({
      date: new Date(),
      event: `Payroll setup in progress`,
      actorType: 'admin',
      actorId: new mongoose.Types.ObjectId(adminId),
    });
  }

  await entry.save();

  const deal = transformDealForFrontend(entry);

  res.status(200).json({
    success: true,
    data: deal,
  });
});

// ============================================
// FINALIZATION: COMPLIANCE
// ============================================

export const uploadCompliance = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const file = req.file;
  const adminId = req.admin?.id;

  if (!file) {
    throw new ApiError(400, 'No file uploaded', 'FILE_UPLOAD_FAILED');
  }

  if (!id || typeof id !== 'string') {
    throw new ApiError(400, 'Invalid deal ID', 'INVALID_ID');
  }

  const entry = await PipelineEntry.findById(id);

  if (!entry || !entry.finalization) {
    throw new ApiError(404, 'Deal or finalization not found', 'NOT_FOUND');
  }

  // Upload to Cloudinary if configured, otherwise use local storage
  let fileUrl: string;

  if (isUsingCloudinary) {
    // Upload to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(file, id, 'compliance');
    fileUrl = cloudinaryResult.secure_url;
  } else {
    // Local storage (fallback for development)
    fileUrl = `/api/v1/files/${id}/compliance/${file.filename}`;
  }

  // Store file metadata
  entry.finalization.compliance.complianceFile = {
    name: file.originalname,
    size: file.size,
    uploadedAt: new Date(),
    url: fileUrl,
    mimeType: file.mimetype,
  };

  // Add timeline event
  entry.timeline.push({
    date: new Date(),
    event: `Compliance document uploaded: ${file.originalname}`,
    actorType: 'admin',
    actorId: new mongoose.Types.ObjectId(adminId),
  });

  await entry.save();

  res.status(200).json({
    success: true,
    data: {
      file: entry.finalization.compliance.complianceFile,
    },
  });
});

export const verifyCompliance = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { taxClassification, laborRequirements, privacyRequirements, notes } = req.body as VerifyComplianceInput;
  const adminId = req.admin?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || !entry.finalization) {
    throw new ApiError(404, 'Deal or finalization not found', 'NOT_FOUND');
  }

  // Update compliance
  entry.finalization.compliance.taxClassification = {
    confirmed: taxClassification,
  };
  entry.finalization.compliance.laborRequirementsMet = laborRequirements;
  entry.finalization.compliance.privacyRequirementsMet = privacyRequirements;
  entry.finalization.compliance.notes = notes;

  // Mark as verified if all requirements met
  if (taxClassification && laborRequirements && privacyRequirements) {
    entry.finalization.compliance.status = 'verified';
    entry.finalization.compliance.verifiedAt = new Date();
    entry.finalization.compliance.countryRequirementsMet = true;

    entry.timeline.push({
      date: new Date(),
      event: `Compliance verified - all requirements met`,
      actorType: 'admin',
      actorId: new mongoose.Types.ObjectId(adminId),
    });
  } else {
    entry.finalization.compliance.status = 'in_progress';

    entry.timeline.push({
      date: new Date(),
      event: `Compliance verification in progress`,
      actorType: 'admin',
      actorId: new mongoose.Types.ObjectId(adminId),
    });
  }

  await entry.save();

  const deal = transformDealForFrontend(entry);

  res.status(200).json({
    success: true,
    data: deal,
  });
});

// ============================================
// FINALIZATION: CSM & START DATE
// ============================================

export const assignCsm = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, phone } = req.body as AssignCsmInput;
  const adminId = req.admin?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || !entry.finalization) {
    throw new ApiError(404, 'Deal or finalization not found', 'NOT_FOUND');
  }

  // Assign CSM
  entry.finalization.csm.status = 'assigned';
  entry.finalization.csm.name = name;
  entry.finalization.csm.email = email;
  entry.finalization.csm.phone = phone;
  entry.finalization.csm.assignedAt = new Date();

  // Add timeline event
  entry.timeline.push({
    date: new Date(),
    event: `CSM assigned: ${name}`,
    actorType: 'admin',
    actorId: new mongoose.Types.ObjectId(adminId),
  });

  await entry.save();

  const deal = transformDealForFrontend(entry);

  res.status(200).json({
    success: true,
    data: deal,
  });
});

export const confirmStartDate = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { candidateConfirmed, clientConfirmed, notes } = req.body as ConfirmStartDateInput;
  const adminId = req.admin?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || !entry.finalization) {
    throw new ApiError(404, 'Deal or finalization not found', 'NOT_FOUND');
  }

  // Update confirmations
  entry.finalization.startDate.candidateConfirmed = candidateConfirmed;
  entry.finalization.startDate.clientConfirmed = clientConfirmed;
  entry.finalization.startDate.notes = notes;

  // Mark as confirmed if both parties confirmed
  if (candidateConfirmed && clientConfirmed) {
    entry.finalization.startDate.status = 'confirmed';
    entry.finalization.startDate.confirmedAt = new Date();

    if (entry.offer?.startDate) {
      entry.finalization.startDate.confirmedDate = entry.offer.startDate;
    }

    entry.timeline.push({
      date: new Date(),
      event: `Start date confirmed by both parties`,
      actorType: 'admin',
      actorId: new mongoose.Types.ObjectId(adminId),
    });
  } else {
    entry.timeline.push({
      date: new Date(),
      event: `Start date confirmation updated`,
      actorType: 'admin',
      actorId: new mongoose.Types.ObjectId(adminId),
    });
  }

  await entry.save();

  const deal = transformDealForFrontend(entry);

  res.status(200).json({
    success: true,
    data: deal,
  });
});

// ============================================
// DEAL COMPLETION & NOTES
// ============================================

export const completeDeal = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const adminId = req.admin?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry || !entry.finalization) {
    throw new ApiError(404, 'Deal or finalization not found', 'NOT_FOUND');
  }

  if (entry.stage === 'hired') {
    throw new ApiError(400, 'Deal already completed', 'DEAL_ALREADY_COMPLETED');
  }

  // Validate all finalization steps complete
  if (!isFinalizationComplete(entry.finalization)) {
    const incompleteSteps = getIncompleteSteps(entry.finalization);
    throw new ApiError(
      400,
      `Cannot complete deal. Missing steps: ${incompleteSteps.join(', ')}`,
      'INCOMPLETE_FINALIZATION'
    );
  }

  // Mark as hired
  entry.stage = 'hired';

  // Add stage change to history
  entry.stageHistory.push({
    from: 'finalizing',
    to: 'hired',
    changedAt: new Date(),
    note: 'Deal completed - candidate hired',
    changedBy: 'admin',
  });

  // Add timeline event
  entry.timeline.push({
    date: new Date(),
    event: `Deal closed — Candidate hired ✅`,
    actorType: 'admin',
    actorId: new mongoose.Types.ObjectId(adminId),
  });

  await entry.save();

  const deal = transformDealForFrontend(entry);

  res.status(200).json({
    success: true,
    data: deal,
  });
});

export const addNote = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content } = req.body as AddNoteInput;
  const adminId = req.admin?.id;

  const entry = await PipelineEntry.findById(id);

  if (!entry) {
    throw new ApiError(404, 'Deal not found', 'NOT_FOUND');
  }

  // Add note
  entry.notes.push({
    content,
    createdAt: new Date(),
    stage: entry.stage,
    authorType: 'admin',
    authorId: new mongoose.Types.ObjectId(adminId || ''),
  });

  // Add timeline event
  entry.timeline.push({
    date: new Date(),
    event: `Note added by admin`,
    actorType: 'admin',
    actorId: new mongoose.Types.ObjectId(adminId),
  });

  await entry.save();

  res.status(200).json({
    success: true,
    data: {
      note: entry.notes[entry.notes.length - 1],
    },
  });
});

export const getNotes = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const entry = await PipelineEntry.findById(id).select('notes').lean();

  if (!entry) {
    throw new ApiError(404, 'Deal not found', 'NOT_FOUND');
  }

  res.status(200).json({
    success: true,
    data: entry.notes || [],
  });
});
