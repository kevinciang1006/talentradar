import { Router } from 'express';
import { searchTalents, getTalentById } from '../controllers/talent.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { talentQuerySchema } from '../validators/talent.validators';

const router = Router();

// All talent routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/talent:
 *   get:
 *     summary: Search and filter talent pool
 *     tags: [Talent]
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
 *         description: Comma-separated role categories (administrative, customer_support, sales, etc.)
 *       - in: query
 *         name: regions
 *         schema:
 *           type: string
 *         description: Comma-separated regions (latin_america, philippines, south_africa, egypt)
 *       - in: query
 *         name: hourlyRateMin
 *         schema:
 *           type: number
 *         description: Minimum hourly rate
 *       - in: query
 *         name: hourlyRateMax
 *         schema:
 *           type: number
 *         description: Maximum hourly rate
 *       - in: query
 *         name: englishProficiency
 *         schema:
 *           type: string
 *         description: Comma-separated proficiency levels (native, fluent, advanced, intermediate)
 *       - in: query
 *         name: availability
 *         schema:
 *           type: string
 *           enum: [full_time, part_time]
 *         description: Availability type
 *       - in: query
 *         name: isImmediatelyAvailable
 *         schema:
 *           type: boolean
 *         description: Filter for immediately available talent
 *       - in: query
 *         name: yearsOfExperienceMin
 *         schema:
 *           type: number
 *         description: Minimum years of experience
 *       - in: query
 *         name: yearsOfExperienceMax
 *         schema:
 *           type: number
 *         description: Maximum years of experience
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [relevance, hourlyRate_asc, hourlyRate_desc, experience, newest]
 *         description: Sort order
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 20
 *         description: Results per page (max 100)
 *     responses:
 *       200:
 *         description: Paginated talent results
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
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     totalPages:
 *                       type: number
 *       401:
 *         description: Not authenticated
 */
router.get('/', validate(talentQuerySchema, 'query'), searchTalents);

/**
 * @swagger
 * /api/v1/talent/{id}:
 *   get:
 *     summary: Get full talent profile by ID
 *     tags: [Talent]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Talent ID
 *     responses:
 *       200:
 *         description: Talent profile with full details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *       404:
 *         description: Talent not found
 *       401:
 *         description: Not authenticated
 */
router.get('/:id', getTalentById);

export default router;
