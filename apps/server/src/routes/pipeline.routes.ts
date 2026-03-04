import { Router } from 'express';
import {
  getPipelineEntries,
  addToPipeline,
  updateStage,
  addNote,
  deletePipelineEntry,
  assignScreeningTask,
  updateScreeningTaskStatus,
  scheduleInterview,
  updateInterviewStatus,
  createOffer,
  completePayment,
  signContract,
  rejectCandidate,
  acceptCounterOffer,
  reviseOffer,
  declineCounterOffer,
  getNegotiationHistory,
} from '../controllers/pipeline.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  addToPipelineSchema,
  updateStageSchema,
  addNoteSchema,
  assignScreeningTaskSchema,
  updateScreeningTaskStatusSchema,
  scheduleInterviewSchema,
  updateInterviewStatusSchema,
  createOfferSchema,
  completePaymentSchema,
  signContractSchema,
  rejectSchema,
  acceptCounterSchema,
  reviseOfferSchema,
  declineCounterSchema,
} from '../validators/pipeline.validators';

const router = Router();

// All pipeline routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/pipeline:
 *   get:
 *     summary: Get pipeline entries for a job
 *     tags: [Pipeline]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID to get pipeline for
 *     responses:
 *       200:
 *         description: Pipeline entries with stage counts
 *       400:
 *         description: Job ID is required
 */
router.get('/', getPipelineEntries);

/**
 * @swagger
 * /api/v1/pipeline:
 *   post:
 *     summary: Add talent to pipeline (shortlist)
 *     tags: [Pipeline]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [jobId, talentId]
 *             properties:
 *               jobId:
 *                 type: string
 *               talentId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Talent added to pipeline
 *       409:
 *         description: Talent already in pipeline for this company
 */
router.post('/', validate(addToPipelineSchema), addToPipeline);

/**
 * @swagger
 * /api/v1/pipeline/{id}/stage:
 *   patch:
 *     summary: Move candidate to a new stage
 *     tags: [Pipeline]
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
 *             required: [stage]
 *             properties:
 *               stage:
 *                 type: string
 *                 enum: [shortlisted, screening, interview, offer, finalizing, hired, rejected]
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stage updated successfully
 *       400:
 *         description: Invalid stage transition
 */
router.patch('/:id/stage', validate(updateStageSchema), updateStage);

/**
 * @swagger
 * /api/v1/pipeline/{id}/notes:
 *   post:
 *     summary: Add a note to pipeline entry
 *     tags: [Pipeline]
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
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Great communication skills in initial call"
 *     responses:
 *       200:
 *         description: Note added successfully
 */
router.post('/:id/notes', validate(addNoteSchema), addNote);

/**
 * @swagger
 * /api/v1/pipeline/{id}:
 *   delete:
 *     summary: Remove candidate from pipeline
 *     tags: [Pipeline]
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
 *         description: Pipeline entry deleted successfully
 */
router.delete('/:id', deletePipelineEntry);

/**
 * @swagger
 * /api/v1/pipeline/{id}/screening-task:
 *   post:
 *     summary: Assign a screening task
 *     tags: [Pipeline]
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
 *             required: [title, description, dueDate]
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Calendar Management Test"
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               taskLink:
 *                 type: string
 *                 format: uri
 *                 example: "https://forms.gle/abc123"
 *               submissionLink:
 *                 type: string
 *                 format: uri
 *                 example: "https://docs.google.com/document/d/xyz"
 *     responses:
 *       200:
 *         description: Screening task assigned
 *       400:
 *         description: Can only assign screening tasks when stage is 'screening'
 */
router.post('/:id/screening-task', validate(assignScreeningTaskSchema), assignScreeningTask);

/**
 * @swagger
 * /api/v1/pipeline/{id}/screening-task/status:
 *   patch:
 *     summary: Update screening task status
 *     tags: [Pipeline]
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
 *                 enum: [draft, sent, submitted, reviewed]
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.patch('/:id/screening-task/status', validate(updateScreeningTaskStatusSchema), updateScreeningTaskStatus);

/**
 * @swagger
 * /api/v1/pipeline/{id}/interview:
 *   post:
 *     summary: Schedule an interview
 *     tags: [Pipeline]
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
 *             required: [scheduledAt, candidateTimezone, meetingLink]
 *             properties:
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *               candidateTimezone:
 *                 type: string
 *                 example: "America/Bogota"
 *               meetingLink:
 *                 type: string
 *                 format: uri
 *                 example: "https://zoom.us/j/123456789"
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Interview scheduled
 */
router.post('/:id/interview', validate(scheduleInterviewSchema), scheduleInterview);

/**
 * @swagger
 * /api/v1/pipeline/{id}/interview/status:
 *   patch:
 *     summary: Update interview status
 *     tags: [Pipeline]
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
 *                 enum: [scheduled, completed, no_show, cancelled]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Interview status updated
 */
router.patch('/:id/interview/status', validate(updateInterviewStatusSchema), updateInterviewStatus);

/**
 * @swagger
 * /api/v1/pipeline/{id}/offer:
 *   post:
 *     summary: Create and send an offer
 *     tags: [Pipeline]
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
 *             required: [rate, hoursPerWeek, type, startDate]
 *             properties:
 *               rate:
 *                 type: number
 *                 example: 9
 *               hoursPerWeek:
 *                 type: number
 *                 example: 40
 *               type:
 *                 type: string
 *                 enum: [full_time, part_time]
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Offer created successfully
 */
router.post('/:id/offer', validate(createOfferSchema), createOffer);

/**
 * @swagger
 * /api/v1/pipeline/{id}/payment:
 *   post:
 *     summary: Complete placement fee payment (simulated)
 *     tags: [Pipeline]
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
 *             required: [method, transactionId]
 *             properties:
 *               method:
 *                 type: string
 *                 example: "credit_card"
 *               transactionId:
 *                 type: string
 *                 example: "TXN123456"
 *     responses:
 *       200:
 *         description: Payment completed
 */
router.post('/:id/payment', validate(completePaymentSchema), completePayment);

/**
 * @swagger
 * /api/v1/pipeline/{id}/contract/sign:
 *   post:
 *     summary: Sign contract (simulated)
 *     tags: [Pipeline]
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
 *         description: Contract signed
 */
router.post('/:id/contract/sign', validate(signContractSchema), signContract);

/**
 * @swagger
 * /api/v1/pipeline/{id}/reject:
 *   patch:
 *     summary: Reject a candidate
 *     tags: [Pipeline]
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
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *                 enum: [skills_mismatch, rate_too_high, poor_communication, not_enough_experience, no_show, chose_another, candidate_declined, other]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Candidate rejected successfully
 *       400:
 *         description: Candidate already rejected or invalid stage
 */
router.patch('/:id/reject', validate(rejectSchema), rejectCandidate);

/**
 * @swagger
 * /api/v1/pipeline/{id}/offer/accept-counter:
 *   post:
 *     summary: Accept candidate's counter-offer
 *     tags: [Pipeline]
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
 *         description: Counter-offer accepted, sent to admin for approval
 */
router.post('/:id/offer/accept-counter', validate(acceptCounterSchema), acceptCounterOffer);

/**
 * @swagger
 * /api/v1/pipeline/{id}/offer/revise:
 *   post:
 *     summary: Send revised offer during negotiation
 *     tags: [Pipeline]
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
 *             required: [rate]
 *             properties:
 *               rate:
 *                 type: number
 *                 example: 10
 *               hoursPerWeek:
 *                 type: number
 *                 example: 40
 *               message:
 *                 type: string
 *                 example: "Thank you for the counter-offer. We can meet at $10/hr."
 *     responses:
 *       200:
 *         description: Revised offer submitted for admin approval
 */
router.post('/:id/offer/revise', validate(reviseOfferSchema), reviseOffer);

/**
 * @swagger
 * /api/v1/pipeline/{id}/offer/decline-counter:
 *   post:
 *     summary: Decline candidate's counter-offer
 *     tags: [Pipeline]
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
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Counter-offer exceeds our budget"
 *     responses:
 *       200:
 *         description: Counter-offer declined, candidate rejected
 */
router.post('/:id/offer/decline-counter', validate(declineCounterSchema), declineCounterOffer);

/**
 * @swagger
 * /api/v1/pipeline/{id}/offer/negotiation-history:
 *   get:
 *     summary: Get complete negotiation history
 *     tags: [Pipeline]
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
 *         description: Negotiation history retrieved
 */
router.get('/:id/offer/negotiation-history', getNegotiationHistory);

export default router;
