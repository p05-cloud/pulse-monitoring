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

  /**
   * Export incidents to CSV
   * GET /api/v1/incidents/export?format=csv|json&startDate=xxx&endDate=xxx
   */
  async export(req: Request, res: Response, next: NextFunction) {
    try {
      const format = (req.query.format as string) || 'csv';
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const monitorId = req.query.monitorId as string | undefined;
      const status = req.query.status as IncidentStatus | undefined;

      const filters: any = {};
      if (monitorId) filters.monitorId = monitorId;
      if (status && Object.values(IncidentStatus).includes(status)) {
        filters.status = status;
      }

      const { incidents } = await incidentService.findAll(filters, 1, 10000);

      // Filter by date range
      let filteredIncidents = incidents;
      if (startDate || endDate) {
        filteredIncidents = incidents.filter(inc => {
          const incDate = new Date(inc.startedAt);
          if (startDate && incDate < startDate) return false;
          if (endDate && incDate > endDate) return false;
          return true;
        });
      }

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=incidents-export-${new Date().toISOString().split('T')[0]}.json`);
        return res.json(filteredIncidents);
      }

      // CSV export
      const csvHeaders = [
        'ID',
        'Monitor Name',
        'Status',
        'Error Category',
        'Error Message',
        'Started At',
        'Acknowledged At',
        'Resolved At',
        'Duration (seconds)',
        'Notes'
      ];

      const csvRows = filteredIncidents.map(inc => [
        inc.id,
        inc.monitor?.name || 'Unknown',
        inc.status,
        inc.errorCategory || '',
        (inc.errorMessage || '').replace(/"/g, '""'),
        inc.startedAt,
        inc.acknowledgedAt || '',
        inc.resolvedAt || '',
        inc.durationSeconds || '',
        (inc.notes || '').replace(/"/g, '""')
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=incidents-export-${new Date().toISOString().split('T')[0]}.csv`);
      return res.send(csvContent);
    } catch (error) {
      return next(error);
    }
  }
}

export const incidentController = new IncidentController();
