import { Router } from 'express';
import {
  getJobs,
  createJob,
  getJobById,
  updateJob,
  deleteJob,
} from '../controllers/job.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createJobSchema, updateJobSchema } from '../validators/job.validators';

const router = Router();

// All job routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/jobs:
 *   get:
 *     summary: List company's open roles
 *     tags: [Jobs]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of company jobs with candidate counts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Not authenticated
 */
router.get('/', getJobs);

/**
 * @swagger
 * /api/v1/jobs:
 *   post:
 *     summary: Create a new job/role
 *     tags: [Jobs]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, roleCategory, description, hourlyRateMin, hourlyRateMax, availability]
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Administrative Assistant"
 *               roleCategory:
 *                 type: string
 *                 enum: [administrative, executive, customer_support, sales, lead_generation, social_media, marketing, graphic_design, medical, legal, insurance, real_estate, ecommerce, bookkeeping_accounting, custom]
 *                 example: "administrative"
 *               customRoleName:
 *                 type: string
 *                 description: Only used when roleCategory is 'custom'
 *               description:
 *                 type: string
 *                 example: "We need an experienced administrative assistant..."
 *               requirements:
 *                 type: string
 *               hourlyRateMin:
 *                 type: number
 *                 example: 7
 *               hourlyRateMax:
 *                 type: number
 *                 example: 10
 *               availability:
 *                 type: string
 *                 enum: [full_time, part_time]
 *                 example: "full_time"
 *     responses:
 *       201:
 *         description: Job created successfully
 *       401:
 *         description: Not authenticated
 */
router.post('/', validate(createJobSchema), createJob);

/**
 * @swagger
 * /api/v1/jobs/{id}:
 *   get:
 *     summary: Get job details
 *     tags: [Jobs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job details with candidate count
 *       404:
 *         description: Job not found
 *       403:
 *         description: Access denied
 *       401:
 *         description: Not authenticated
 */
router.get('/:id', getJobById);

/**
 * @swagger
 * /api/v1/jobs/{id}:
 *   patch:
 *     summary: Update job
 *     tags: [Jobs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [open, paused, closed]
 *     responses:
 *       200:
 *         description: Job updated successfully
 *       404:
 *         description: Job not found
 *       403:
 *         description: Access denied
 */
router.patch('/:id', validate(updateJobSchema), updateJob);

/**
 * @swagger
 * /api/v1/jobs/{id}:
 *   delete:
 *     summary: Delete job
 *     tags: [Jobs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job deleted successfully
 *       409:
 *         description: Cannot delete job with existing candidates
 *       404:
 *         description: Job not found
 */
router.delete('/:id', deleteJob);

export default router;
