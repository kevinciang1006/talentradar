import { Router } from 'express';
import { authenticateAdmin } from '../middleware/admin.middleware';
import { validate } from '../middleware/validate.middleware';
import { upload } from '../middleware/upload.middleware';
import * as controller from '../controllers/admin.deals.controller';
import * as validators from '../validators/admin.deals.validators';

const router = Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// ============================================
// DEAL LISTING & RETRIEVAL
// ============================================

/**
 * @swagger
 * /api/v1/admin/deals:
 *   get:
 *     summary: Get all deals with filters
 *     tags: [Admin Deals]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: stage
 *         schema:
 *           type: string
 *           enum: [new_offers, presented, accepted, in_progress, completed]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of deals
 */
router.get('/', controller.getDeals);

/**
 * @swagger
 * /api/v1/admin/deals/stats:
 *   get:
 *     summary: Get deal statistics (counts by stage)
 *     tags: [Admin Deals]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Stage counts
 */
router.get('/stats', controller.getDealStats);

/**
 * @swagger
 * /api/v1/admin/deals/{id}:
 *   get:
 *     summary: Get single deal by ID
 *     tags: [Admin Deals]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deal details
 */
router.get('/:id', controller.getDealById);

/**
 * @swagger
 * /api/v1/admin/deals/{id}/timeline:
 *   get:
 *     summary: Get deal timeline events
 *     tags: [Admin Deals]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Timeline events
 */
router.get('/:id/timeline', controller.getDealTimeline);

// ============================================
// OFFER MANAGEMENT
// ============================================

router.patch(
  '/:id/offer/approve',
  validate(validators.approveOfferSchema),
  controller.approveOffer
);

router.patch(
  '/:id/offer/present',
  validate(validators.presentOfferSchema),
  controller.presentOffer
);

router.post(
  '/:id/offer/flag',
  validate(validators.flagOfferSchema),
  controller.flagOffer
);

router.patch('/:id/offer/unflag', controller.unflagOffer);

router.patch(
  '/:id/offer/candidate-response',
  validate(validators.candidateResponseSchema),
  controller.recordCandidateResponse
);

// ============================================
// FINALIZATION: INVOICE & PAYMENT
// ============================================

router.post(
  '/:id/finalization/invoice/generate',
  validate(validators.generateInvoiceSchema),
  controller.generateInvoice
);

router.post(
  '/:id/finalization/invoice/upload',
  upload.single('file'),
  controller.uploadInvoice
);

router.patch(
  '/:id/finalization/payment/received',
  validate(validators.paymentReceivedSchema),
  controller.recordPayment
);

// ============================================
// FINALIZATION: CONTRACT
// ============================================

router.post(
  '/:id/finalization/contract/generate',
  validate(validators.generateContractSchema),
  controller.generateContract
);

router.post(
  '/:id/finalization/contract/upload',
  upload.single('file'),
  controller.uploadContract
);

router.patch(
  '/:id/finalization/contract/send-client',
  controller.sendContractToClient
);

router.patch(
  '/:id/finalization/contract/send-candidate',
  controller.sendContractToCandidate
);

router.patch(
  '/:id/finalization/contract/client-signed',
  validate(validators.signContractSchema),
  controller.markClientSigned
);

router.patch(
  '/:id/finalization/contract/candidate-signed',
  validate(validators.signContractSchema),
  controller.markCandidateSigned
);

// ============================================
// FINALIZATION: PAYROLL
// ============================================

router.patch(
  '/:id/finalization/payroll/setup',
  validate(validators.setupPayrollSchema),
  controller.setupPayroll
);

// ============================================
// FINALIZATION: COMPLIANCE
// ============================================

router.post(
  '/:id/finalization/compliance/upload',
  upload.single('file'),
  controller.uploadCompliance
);

router.patch(
  '/:id/finalization/compliance/verify',
  validate(validators.verifyComplianceSchema),
  controller.verifyCompliance
);

// ============================================
// FINALIZATION: CSM & START DATE
// ============================================

router.patch(
  '/:id/finalization/csm/assign',
  validate(validators.assignCsmSchema),
  controller.assignCsm
);

router.patch(
  '/:id/finalization/start-date/confirm',
  validate(validators.confirmStartDateSchema),
  controller.confirmStartDate
);

// ============================================
// DEAL COMPLETION
// ============================================

/**
 * @swagger
 * /api/v1/admin/deals/{id}/complete:
 *   post:
 *     summary: Mark deal as hired (complete)
 *     tags: [Admin Deals]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deal marked as hired
 */
router.post('/:id/complete', controller.completeDeal);

// ============================================
// NOTES
// ============================================

router.post(
  '/:id/notes',
  validate(validators.addNoteSchema),
  controller.addNote
);

router.get('/:id/notes', controller.getNotes);

export default router;
