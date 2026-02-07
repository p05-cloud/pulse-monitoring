import { Router } from 'express';
import { userController } from './user.controller';
import { requireAuth, requireAdmin } from '../auth/auth.middleware';

const router = Router();

// All user routes require authentication and admin role
router.use(requireAuth, requireAdmin);

// GET /api/v1/users
router.get('/', userController.getAll.bind(userController));

// GET /api/v1/users/:id
router.get('/:id', userController.getOne.bind(userController));

// POST /api/v1/users
router.post('/', userController.create.bind(userController));

// PUT /api/v1/users/:id
router.put('/:id', userController.update.bind(userController));

// DELETE /api/v1/users/:id
router.delete('/:id', userController.remove.bind(userController));

export default router;
