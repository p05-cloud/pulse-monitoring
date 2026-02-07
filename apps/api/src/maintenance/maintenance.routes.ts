import { Router } from 'express';
import { maintenanceController } from './maintenance.controller';
import { requireAuth, requireDeveloper } from '../auth/auth.middleware';

const router = Router();

// All maintenance routes require authentication
// Viewing requires VIEWER or higher, modifying requires DEVELOPER or higher

router.get('/', requireAuth, maintenanceController.getAll.bind(maintenanceController));
router.get('/:id', requireAuth, maintenanceController.getById.bind(maintenanceController));
router.post('/', requireAuth, requireDeveloper, maintenanceController.create.bind(maintenanceController));
router.put('/:id', requireAuth, requireDeveloper, maintenanceController.update.bind(maintenanceController));
router.delete('/:id', requireAuth, requireDeveloper, maintenanceController.delete.bind(maintenanceController));
router.put('/:id/toggle', requireAuth, requireDeveloper, maintenanceController.toggleActive.bind(maintenanceController));

export default router;
