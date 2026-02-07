import { Router } from 'express';
import { incidentController } from './incident.controller';
import { requireAuth } from '../../auth/auth.middleware';

const router = Router();

// All incident routes require authentication
router.use(requireAuth);

// GET /api/v1/incidents
router.get('/', incidentController.getAll.bind(incidentController));

// GET /api/v1/incidents/export - must be before /:id
router.get('/export', incidentController.export.bind(incidentController));

// GET /api/v1/incidents/:id
router.get('/:id', incidentController.getOne.bind(incidentController));

// POST /api/v1/incidents/:id/acknowledge
router.post('/:id/acknowledge', incidentController.acknowledge.bind(incidentController));

// POST /api/v1/incidents/:id/resolve
router.post('/:id/resolve', incidentController.resolve.bind(incidentController));

// PUT /api/v1/incidents/:id/notes
router.put('/:id/notes', incidentController.updateNotes.bind(incidentController));

export default router;
