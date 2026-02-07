import { Request, Response, NextFunction } from 'express';
import { maintenanceService } from './maintenance.service';
import { z } from 'zod';

const CreateMaintenanceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  monitorIds: z.array(z.string()).min(1, 'At least one monitor is required'),
  startTime: z.string().transform(s => new Date(s)),
  endTime: z.string().transform(s => new Date(s)),
  timezone: z.string().default('UTC'),
  recurring: z.boolean().default(false),
  cronPattern: z.string().optional(),
  notifyBefore: z.number().min(0).max(1440).default(30), // Max 24 hours
});

const UpdateMaintenanceSchema = CreateMaintenanceSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export class MaintenanceController {
  // GET /api/v1/maintenance
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filter = req.query.filter as string;
      let windows;

      if (filter === 'upcoming') {
        windows = await maintenanceService.getUpcoming();
      } else if (filter === 'active') {
        windows = await maintenanceService.getActive();
      } else {
        windows = await maintenanceService.getAll();
      }

      res.json({ success: true, data: windows });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/maintenance/:id
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const window = await maintenanceService.getById(req.params.id);
      if (!window) {
        return res.status(404).json({ success: false, error: 'Maintenance window not found' });
      }
      return res.json({ success: true, data: window });
    } catch (error) {
      return next(error);
    }
  }

  // POST /api/v1/maintenance
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = CreateMaintenanceSchema.parse(req.body);

      // Validate that end time is after start time
      if (validated.endTime <= validated.startTime) {
        return res.status(400).json({
          success: false,
          error: 'End time must be after start time',
        });
      }

      const window = await maintenanceService.create(validated);
      return res.status(201).json({ success: true, data: window });
    } catch (error) {
      return next(error);
    }
  }

  // PUT /api/v1/maintenance/:id
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = UpdateMaintenanceSchema.parse(req.body);

      // Validate times if both provided
      if (validated.startTime && validated.endTime) {
        if (validated.endTime <= validated.startTime) {
          return res.status(400).json({
            success: false,
            error: 'End time must be after start time',
          });
        }
      }

      const window = await maintenanceService.update(req.params.id, validated);
      return res.json({ success: true, data: window });
    } catch (error) {
      return next(error);
    }
  }

  // DELETE /api/v1/maintenance/:id
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await maintenanceService.delete(req.params.id);
      res.json({ success: true, message: 'Maintenance window deleted' });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/v1/maintenance/:id/toggle
  async toggleActive(req: Request, res: Response, next: NextFunction) {
    try {
      const { isActive } = req.body;
      const window = await maintenanceService.toggleActive(req.params.id, isActive);
      res.json({ success: true, data: window });
    } catch (error) {
      next(error);
    }
  }
}

export const maintenanceController = new MaintenanceController();
