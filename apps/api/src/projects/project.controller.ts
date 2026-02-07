import { Request, Response, NextFunction } from 'express';
import { projectService, CreateProjectSchema, UpdateProjectSchema } from './project.service';

export class ProjectController {
  /**
   * Get all projects
   * GET /api/v1/projects
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const projects = await projectService.findAll();
      res.json({ success: true, data: projects });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get project by ID
   * GET /api/v1/projects/:id
   */
  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectService.findById(req.params.id);
      res.json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new project
   * POST /api/v1/projects
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = CreateProjectSchema.parse(req.body);
      const project = await projectService.create(data);

      res.status(201).json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update project
   * PUT /api/v1/projects/:id
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = UpdateProjectSchema.parse(req.body);
      const project = await projectService.update(req.params.id, data);

      res.json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete project
   * DELETE /api/v1/projects/:id
   */
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await projectService.delete(req.params.id);
      res.json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get project health
   * GET /api/v1/projects/:id/health
   */
  async getHealth(req: Request, res: Response, next: NextFunction) {
    try {
      const health = await projectService.getHealth(req.params.id);
      res.json({ success: true, data: health });
    } catch (error) {
      next(error);
    }
  }
}

export const projectController = new ProjectController();
