import { Router } from 'express';
import {
  getStats,
  getUpcomingInterviews,
  getActiveOffers,
  getRecentActivity,
} from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats (shortlisted, in pipeline, interviews, hired, finalizing)
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
 *                   properties:
 *                     totalShortlisted:
 *                       type: number
 *                     inPipeline:
 *                       type: number
 *                     interviews:
 *                       type: number
 *                     totalHired:
 *                       type: number
 *                     finalizing:
 *                       type: number
 */
router.get('/stats', getStats);

/**
 * @swagger
 * /api/v1/dashboard/upcoming-interviews:
 *   get:
 *     summary: Get upcoming interviews
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of upcoming scheduled interviews (max 5)
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
 */
router.get('/upcoming-interviews', getUpcomingInterviews);

/**
 * @swagger
 * /api/v1/dashboard/active-offers:
 *   get:
 *     summary: Get active offers awaiting response
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of active offers
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
 */
router.get('/active-offers', getActiveOffers);

/**
 * @swagger
 * /api/v1/dashboard/recent-activity:
 *   get:
 *     summary: Get recent pipeline activity feed
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Recent stage changes and activity (last 10)
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
 */
router.get('/recent-activity', getRecentActivity);

export default router;
