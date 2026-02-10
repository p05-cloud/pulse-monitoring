import { Router } from 'express';
import { authController } from './auth.controller';
import { requireAuth } from './auth.middleware';
import { authRateLimiter } from '../middleware/rate.limiter';

const router = Router();

// POST /api/v1/auth/login
router.post('/login', authRateLimiter, authController.login.bind(authController));

// POST /api/v1/auth/logout
router.post('/logout', authController.logout.bind(authController));

// POST /api/v1/auth/refresh
router.post('/refresh', authRateLimiter, authController.refresh.bind(authController));

// GET /api/v1/auth/me (protected)
router.get('/me', requireAuth, authController.me.bind(authController));

export default router;
