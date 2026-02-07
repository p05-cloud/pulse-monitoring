import { Router } from 'express';
import { monitorController } from './monitor.controller';
import { requireAuth } from '../../auth/auth.middleware';

const router = Router();

// All monitor routes require authentication
router.use(requireAuth);

// GET /api/v1/monitors
router.get('/', monitorController.getAll.bind(monitorController));

// GET /api/v1/monitors/:id
router.get('/:id', monitorController.getOne.bind(monitorController));

// POST /api/v1/monitors
router.post('/', monitorController.create.bind(monitorController));

// PUT /api/v1/monitors/:id
router.put('/:id', monitorController.update.bind(monitorController));

// DELETE /api/v1/monitors/:id
router.delete('/:id', monitorController.remove.bind(monitorController));

// POST /api/v1/monitors/:id/pause
router.post('/:id/pause', monitorController.pause.bind(monitorController));

// POST /api/v1/monitors/:id/resume
router.post('/:id/resume', monitorController.resume.bind(monitorController));

// GET /api/v1/monitors/:id/checks
router.get('/:id/checks', monitorController.getChecks.bind(monitorController));

// GET /api/v1/monitors/:id/incidents
router.get('/:id/incidents', monitorController.getIncidents.bind(monitorController));

export default router;
