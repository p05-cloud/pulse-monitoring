import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { requireAuth } from '../auth/auth.middleware';

const router = Router();

// All dashboard routes require authentication
router.use(requireAuth);

// GET /api/v1/dashboard/summary
router.get('/summary', dashboardController.getSummary.bind(dashboardController));

// GET /api/v1/dashboard/projects
router.get('/projects', dashboardController.getProjectsHealth.bind(dashboardController));

// GET /api/v1/dashboard/activity
router.get('/activity', dashboardController.getActivity.bind(dashboardController));

export default router;
