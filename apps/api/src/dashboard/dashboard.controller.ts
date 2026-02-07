import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';

export class DashboardController {
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await dashboardService.getSummary();
      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProjectsHealth(req: Request, res: Response, next: NextFunction) {
    try {
      const projects = await dashboardService.getProjectsHealth();
      res.json({
        success: true,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  }

  async getActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await dashboardService.getActivity(limit);
      res.json({
        success: true,
        data: activities,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
