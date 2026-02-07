import { Request, Response, NextFunction } from 'express';
import { incidentService, UpdateIncidentSchema } from './incident.service';
import { parsePagination, parseFilters, buildPaginatedResponse } from '../../utils/helpers';
import { IncidentStatus } from '@prisma/client';

export class IncidentController {
  /**
   * Get all incidents with filtering
   * GET /api/v1/incidents?monitorId=xxx&status=OPEN
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = parsePagination(req);
      const rawFilters = parseFilters(req.query);

      const filters: any = {};

      if (rawFilters.monitorId) {
        filters.monitorId = rawFilters.monitorId;
      }

      if (rawFilters.status && Object.values(IncidentStatus).includes(rawFilters.status)) {
        filters.status = rawFilters.status as IncidentStatus;
      }

      const { incidents, total } = await incidentService.findAll(filters, page, limit);

      const response = buildPaginatedResponse(incidents, total, page, limit);
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get incident by ID
   * GET /api/v1/incidents/:id
   */
  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const incident = await incidentService.findById(req.params.id);
      res.json({ success: true, data: incident });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Acknowledge incident
   * POST /api/v1/incidents/:id/acknowledge
   */
  async acknowledge(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new Error('User not authenticated'));
      }

      const incident = await incidentService.acknowledge(req.params.id, req.user.userId);
      res.json({ success: true, data: incident });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Manually resolve incident
   * POST /api/v1/incidents/:id/resolve
   */
  async resolve(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new Error('User not authenticated'));
      }

      const incident = await incidentService.resolve(req.params.id, req.user.userId);
      res.json({ success: true, data: incident });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update incident notes
   * PUT /api/v1/incidents/:id/notes
   */
  async updateNotes(req: Request, res: Response, next: NextFunction) {
    try {
      const { notes } = UpdateIncidentSchema.parse(req.body);
      const incident = await incidentService.updateNotes(req.params.id, notes || '');

      res.json({ success: true, data: incident });
    } catch (error) {
      next(error);
    }
  }
}

export const incidentController = new IncidentController();
