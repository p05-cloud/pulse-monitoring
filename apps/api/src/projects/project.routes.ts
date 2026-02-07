import { Router } from 'express';
import { projectController } from './project.controller';
import { requireAuth } from '../auth/auth.middleware';

const router = Router();

// All project routes require authentication
router.use(requireAuth);

// GET /api/v1/projects
router.get('/', projectController.getAll.bind(projectController));

// GET /api/v1/projects/:id
router.get('/:id', projectController.getOne.bind(projectController));

// POST /api/v1/projects
router.post('/', projectController.create.bind(projectController));

// PUT /api/v1/projects/:id
router.put('/:id', projectController.update.bind(projectController));

// DELETE /api/v1/projects/:id
router.delete('/:id', projectController.remove.bind(projectController));

// GET /api/v1/projects/:id/health
router.get('/:id/health', projectController.getHealth.bind(projectController));

export default router;
