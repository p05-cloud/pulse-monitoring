import { Router } from 'express';
import { alertController } from './alert.controller';
import { requireAuth } from '../../auth/auth.middleware';

const router = Router();

// All alert contact routes require authentication
router.use(requireAuth);

// GET /api/v1/alert-contacts
router.get('/', alertController.getAll.bind(alertController));

// GET /api/v1/alert-contacts/:id
router.get('/:id', alertController.getOne.bind(alertController));

// POST /api/v1/alert-contacts
router.post('/', alertController.create.bind(alertController));

// PUT /api/v1/alert-contacts/:id
router.put('/:id', alertController.update.bind(alertController));

// DELETE /api/v1/alert-contacts/:id
router.delete('/:id', alertController.remove.bind(alertController));

// POST /api/v1/alert-contacts/:id/test
router.post('/:id/test', alertController.test.bind(alertController));

export default router;
