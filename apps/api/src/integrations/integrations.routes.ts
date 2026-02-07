import { Router } from 'express';
import { integrationsController } from './integrations.controller';
import { requireAuth, requireAdmin } from '../auth/auth.middleware';

const router = Router();

// All integration routes require admin access

router.get('/', requireAuth, requireAdmin, integrationsController.getAll.bind(integrationsController));
router.get('/:id', requireAuth, requireAdmin, integrationsController.getById.bind(integrationsController));
router.post('/', requireAuth, requireAdmin, integrationsController.create.bind(integrationsController));
router.put('/:id', requireAuth, requireAdmin, integrationsController.update.bind(integrationsController));
router.delete('/:id', requireAuth, requireAdmin, integrationsController.delete.bind(integrationsController));
router.post('/:id/test', requireAuth, requireAdmin, integrationsController.test.bind(integrationsController));

export default router;
