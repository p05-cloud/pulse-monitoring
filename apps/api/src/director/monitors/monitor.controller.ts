import { Request, Response, NextFunction } from 'express';
import { monitorService, CreateMonitorSchema, UpdateMonitorSchema } from './monitor.service';
import { parsePagination, parseFilters, buildPaginatedResponse } from '../../utils/helpers';
import { MonitorStatus } from '@prisma/client';

export class MonitorController {
  /**
   * Get all monitors with filtering
   * GET /api/v1/monitors?projectId=xxx&status=UP&tags=production,critical
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = parsePagination(req);
      const rawFilters = parseFilters(req.query);

      const filters: any = {};

      if (rawFilters.projectId) {
        filters.projectId = rawFilters.projectId;
      }

      if (rawFilters.status && Object.values(MonitorStatus).includes(rawFilters.status)) {
        filters.status = rawFilters.status as MonitorStatus;
      }

      if (rawFilters.tags) {
        filters.tags = Array.isArray(rawFilters.tags) ? rawFilters.tags : [rawFilters.tags];
      }

      const { monitors, total } = await monitorService.findAll(filters, page, limit);

      const response = buildPaginatedResponse(monitors, total, page, limit);
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get monitor by ID
   * GET /api/v1/monitors/:id
   */
  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const monitor = await monitorService.findById(req.params.id);
      res.json({ success: true, data: monitor });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new monitor
   * POST /api/v1/monitors
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = CreateMonitorSchema.parse(req.body);
      const monitor = await monitorService.create(data);

      res.status(201).json({ success: true, data: monitor });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update monitor
   * PUT /api/v1/monitors/:id
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = UpdateMonitorSchema.parse(req.body);
      const monitor = await monitorService.update(req.params.id, data);

      res.json({ success: true, data: monitor });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete monitor
   * DELETE /api/v1/monitors/:id
   */
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await monitorService.delete(req.params.id);
      res.json({ success: true, message: 'Monitor deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Pause monitor
   * POST /api/v1/monitors/:id/pause
   */
  async pause(req: Request, res: Response, next: NextFunction) {
    try {
      const monitor = await monitorService.pause(req.params.id);
      res.json({ success: true, data: monitor });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resume monitor
   * POST /api/v1/monitors/:id/resume
   */
  async resume(req: Request, res: Response, next: NextFunction) {
    try {
      const monitor = await monitorService.resume(req.params.id);
      res.json({ success: true, data: monitor });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get check history
   * GET /api/v1/monitors/:id/checks
   */
  async getChecks(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const checks = await monitorService.getChecks(req.params.id, limit);

      res.json({ success: true, data: checks });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get incident history
   * GET /api/v1/monitors/:id/incidents
   */
  async getIncidents(req: Request, res: Response, next: NextFunction) {
    try {
      const incidents = await monitorService.getIncidents(req.params.id);
      res.json({ success: true, data: incidents });
    } catch (error) {
      next(error);
    }
  }
}

export const monitorController = new MonitorController();
