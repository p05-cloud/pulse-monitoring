import { Request, Response, NextFunction } from 'express';
import { userService, CreateUserSchema, UpdateUserSchema } from './user.service';
import { parsePagination, buildPaginatedResponse } from '../utils/helpers';

export class UserController {
  /**
   * Get all users
   * GET /api/v1/users
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = parsePagination(req);
      const { users, total } = await userService.findAll(page, limit);

      const response = buildPaginatedResponse(users, total, page, limit);
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   * GET /api/v1/users/:id
   */
  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.findById(req.params.id);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new user
   * POST /api/v1/users
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = CreateUserSchema.parse(req.body);
      const user = await userService.create(data);

      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user
   * PUT /api/v1/users/:id
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = UpdateUserSchema.parse(req.body);
      const user = await userService.update(req.params.id, data);

      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user
   * DELETE /api/v1/users/:id
   */
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await userService.delete(req.params.id);
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
