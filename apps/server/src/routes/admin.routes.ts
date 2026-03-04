import { Router } from 'express';
import {
  getDashboardStats,
  getActionRequired,
  getDeals,
  getDealById,
  updateOfferStatus,
  flagOfferIssue,
  updatePaymentStatus,
  updateContractStatus,
  updatePayrollStatus,
  updateComplianceStatus,
  assignCsm,
  confirmStartDate,
  markAsHired,
  getCompanies,
  getCompanyById,
  getTalentForAdmin,
} from '../controllers/admin.controller';
import { authenticateAdmin } from '../middleware/admin.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  updateOfferStatusSchema,
  flagOfferIssueSchema,
  updatePaymentStatusSchema,
  updateContractStatusSchema,
  updatePayrollStatusSchema,
  updateComplianceSchema,
  assignCsmSchema,
  confirmStartDateSchema,
  markAsHiredSchema,
} from '../validators/admin.validators';
import { adminTalentQuerySchema } from '../validators/talent.validators';

const router = Router();

// All admin routes require admin authentication
router.use(authenticateAdmin);

/**
 * @swagger
 * /api/v1/admin/dashboard/stats:
 *   get:
 *     summary: Admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     activeDeals:
 *                       type: number
 *                     actionRequired:
 *                       type: number
 *                     hiresThisMonth:
 *                       type: number
 *                     revenueThisMonth:
 *                       type: number
 */
router.get('/dashboard/stats', getDashboardStats);

/**
 * @swagger
 * /api/v1/admin/dashboard/action-required:
 *   get:
 *     summary: Items requiring admin action
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Pipeline entries needing admin review
 */
router.get('/dashboard/action-required', getActionRequired);

/**
 * @swagger
 * /api/v1/admin/deals:
 *   get:
 *     summary: All active deals (admin kanban data)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: stage
 *         schema:
 *           type: string
 *           enum: [offer, finalizing, hired]
 *         description: Filter by stage
 *     responses:
 *       200:
 *         description: List of deals with company and talent info
 */
router.get('/deals', getDeals);

/**
 * @swagger
 * /api/v1/admin/deals/{id}:
 *   get:
 *     summary: Full deal details
 *     tags: [Admin]
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
 *         description: Complete deal information
 *       404:
 *         description: Deal not found
 */
router.get('/deals/:id', getDealById);

/**
 * @swagger
 * /api/v1/admin/deals/{id}/offer-status:
 *   patch:
 *     summary: Update offer status (review, present, record response)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [sent, under_review, presented, accepted, negotiating, declined, withdrawn, flagged]
 *               counterOffer:
 *                 type: object
 *                 properties:
 *                   rate:
 *                     type: number
 *                   message:
 *                     type: string
 *               declineReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Offer status updated
 */
router.patch('/deals/:id/offer-status', validate(updateOfferStatusSchema), updateOfferStatus);

/**
 * @swagger
 * /api/v1/admin/deals/{id}/flag-offer:
 *   post:
 *     summary: Flag an issue with an offer
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [issueType, details]
 *             properties:
 *               issueType:
 *                 type: string
 *                 example: "rate_mismatch"
 *               details:
 *                 type: string
 *     responses:
 *       200:
 *         description: Offer flagged successfully
 */
router.post('/deals/:id/flag-offer', validate(flagOfferIssueSchema), flagOfferIssue);

/**
 * @swagger
 * /api/v1/admin/deals/{id}/finalization/payment:
 *   patch:
 *     summary: Update payment status
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, invoiced, paid]
 *               amount:
 *                 type: number
 *               invoiceId:
 *                 type: string
 *               transactionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment status updated
 */
router.patch('/deals/:id/finalization/payment', validate(updatePaymentStatusSchema), updatePaymentStatus);

/**
 * @swagger
 * /api/v1/admin/deals/{id}/finalization/contract:
 *   patch:
 *     summary: Update contract status
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, generated, sent, signed]
 *               contractId:
 *                 type: string
 *               clientSigned:
 *                 type: boolean
 *               candidateSigned:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Contract status updated
 */
router.patch('/deals/:id/finalization/contract', validate(updateContractStatusSchema), updateContractStatus);

/**
 * @swagger
 * /api/v1/admin/deals/{id}/finalization/payroll:
 *   patch:
 *     summary: Update payroll setup status
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, complete]
 *               partner:
 *                 type: string
 *                 example: "Deel"
 *               reference:
 *                 type: string
 *               firstPayDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Payroll status updated
 */
router.patch('/deals/:id/finalization/payroll', validate(updatePayrollStatusSchema), updatePayrollStatus);

/**
 * @swagger
 * /api/v1/admin/deals/{id}/finalization/compliance:
 *   patch:
 *     summary: Update compliance verification
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status, countryRequirementsMet]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, verified]
 *               taxClassification:
 *                 type: string
 *               countryRequirementsMet:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Compliance status updated
 */
router.patch('/deals/:id/finalization/compliance', validate(updateComplianceSchema), updateComplianceStatus);

/**
 * @swagger
 * /api/v1/admin/deals/{id}/finalization/csm:
 *   patch:
 *     summary: Assign Customer Success Manager
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, phone]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Paula Martinez"
 *               email:
 *                 type: string
 *                 example: "paula@remoteleverage.com"
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: CSM assigned successfully
 */
router.patch('/deals/:id/finalization/csm', validate(assignCsmSchema), assignCsm);

/**
 * @swagger
 * /api/v1/admin/deals/{id}/finalization/start-date:
 *   patch:
 *     summary: Confirm start date
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [confirmedDate]
 *             properties:
 *               confirmedDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Start date confirmed
 */
router.patch('/deals/:id/finalization/start-date', validate(confirmStartDateSchema), confirmStartDate);

/**
 * @swagger
 * /api/v1/admin/deals/{id}/mark-hired:
 *   post:
 *     summary: Close deal and mark as hired
 *     tags: [Admin]
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
 *         description: Deal closed, candidate marked as hired
 *       400:
 *         description: Cannot mark as hired - incomplete finalization steps
 */
router.post('/deals/:id/mark-hired', validate(markAsHiredSchema), markAsHired);

/**
 * @swagger
 * /api/v1/admin/companies:
 *   get:
 *     summary: List all registered companies
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by company name or email
 *     responses:
 *       200:
 *         description: List of companies with stats
 */
router.get('/companies', getCompanies);

/**
 * @swagger
 * /api/v1/admin/companies/{id}:
 *   get:
 *     summary: Company details with hiring activity
 *     tags: [Admin]
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
 *         description: Company details with jobs, pipeline activity, and hires
 *       404:
 *         description: Company not found
 */
router.get('/companies/:id', getCompanyById);

/**
 * @swagger
 * /api/v1/admin/talent:
 *   get:
 *     summary: List all talent pool (admin view)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Text search across name, bio, headline, skills
 *       - in: query
 *         name: roleCategories
 *         schema:
 *           type: string
 *         description: Comma-separated role categories
 *       - in: query
 *         name: regions
 *         schema:
 *           type: string
 *         description: Comma-separated regions (latin_america, philippines, south_africa, egypt)
 *       - in: query
 *         name: hourlyRateMin
 *         schema:
 *           type: number
 *       - in: query
 *         name: hourlyRateMax
 *         schema:
 *           type: number
 *       - in: query
 *         name: englishProficiency
 *         schema:
 *           type: string
 *         description: Comma-separated proficiency levels
 *       - in: query
 *         name: availability
 *         schema:
 *           type: string
 *           enum: [full_time, part_time]
 *       - in: query
 *         name: isImmediatelyAvailable
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: yearsOfExperienceMin
 *         schema:
 *           type: number
 *       - in: query
 *         name: yearsOfExperienceMax
 *         schema:
 *           type: number
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, in_pipeline, hired, inactive]
 *         description: Filter by talent status
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [relevance, hourlyRate_asc, hourlyRate_desc, experience, newest]
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 20
 *     responses:
 *       200:
 *         description: List of talents with pipeline counts
 */
router.get('/talent', validate(adminTalentQuerySchema, 'query'), getTalentForAdmin);

export default router;
