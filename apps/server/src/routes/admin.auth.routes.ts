import { Router } from 'express';
import { login, getMe } from '../controllers/admin.auth.controller';
import { authenticateAdmin } from '../middleware/admin.middleware';
import { validate } from '../middleware/validate.middleware';
import { adminLoginSchema } from '../validators/admin.validators';

const router = Router();

/**
 * @swagger
 * /api/v1/admin/auth/login:
 *   post:
 *     summary: Login to admin account
 *     tags: [Admin Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: "admin@remoteleverage.com"
 *               password:
 *                 type: string
 *                 example: "admin123"
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
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
 *                     token:
 *                       type: string
 *                     admin:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                           enum: [admin, csm]
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validate(adminLoginSchema), login);

/**
 * @swagger
 * /api/v1/admin/auth/me:
 *   get:
 *     summary: Get current admin info
 *     tags: [Admin Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current admin info
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
 *                     admin:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *       401:
 *         description: Not authenticated
 */
router.get('/me', authenticateAdmin, getMe);

export default router;
