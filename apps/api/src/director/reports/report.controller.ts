import { Request, Response, NextFunction } from 'express';
import { reportService } from './report.service';
import { reportQueue } from '../../orchestration/queues/report.queue';
import { reportScheduler } from '../../orchestration/scheduler/report.scheduler';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const CreateScheduleSchema = z.object({
  name: z.string().min(1),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
  projectIds: z.array(z.string()),
  recipients: z.array(z.string().email()),
  format: z.enum(['PDF', 'EXCEL', 'CSV']),
});

const GenerateReportSchema = z.object({
  name: z.string().min(1),
  format: z.enum(['PDF', 'EXCEL', 'CSV']),
  projectIds: z.array(z.string()).optional(),
  recipients: z.array(z.string().email()).optional(),
  startDate: z.string(),
  endDate: z.string(),
});

export class ReportController {
  /**
   * Get all report schedules
   */
  async getSchedules(req: Request, res: Response, next: NextFunction) {
    try {
      const schedules = await reportService.getSchedules();
      res.json({ success: true, data: schedules });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get report schedule by ID
   */
  async getScheduleById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const schedule = await reportService.getScheduleById(id);
      res.json({ success: true, data: schedule });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create report schedule
   */
  async createSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const data = CreateScheduleSchema.parse(req.body);
      const schedule = await reportService.createSchedule(data);

      logger.info(`Report schedule created: ${schedule.id}`);
      res.status(201).json({ success: true, data: schedule });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update report schedule
   */
  async updateSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = CreateScheduleSchema.partial().parse(req.body);
      const schedule = await reportService.updateSchedule(id, data);

      logger.info(`Report schedule updated: ${schedule.id}`);
      res.json({ success: true, data: schedule });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete report schedule
   */
  async deleteSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await reportService.deleteSchedule(id);

      logger.info(`Report schedule deleted: ${id}`);
      res.json({ success: true, message: 'Report schedule deleted' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Manually trigger a schedule
   */
  async triggerSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await reportScheduler.triggerSchedule(id);

      logger.info(`Report schedule triggered: ${id}`);
      res.json({ success: true, message: 'Report generation started' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate on-demand report
   */
  async generateReport(req: Request, res: Response, next: NextFunction) {
    try {
      const data = GenerateReportSchema.parse(req.body);

      await reportQueue.addReportJob({
        name: data.name,
        format: data.format,
        projectIds: data.projectIds || [],
        recipients: data.recipients || [],
        startDate: data.startDate,
        endDate: data.endDate,
      });

      logger.info(`On-demand report queued: ${data.name}`);
      res.json({ success: true, message: 'Report generation started' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get generated reports
   */
  async getGeneratedReports(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const reports = await reportService.getGeneratedReports(limit);
      res.json({ success: true, data: reports });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get generated report by ID
   */
  async getGeneratedReportById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const report = await reportService.getGeneratedReportById(id);
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download generated report
   */
  async downloadReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const report = await reportService.getGeneratedReportById(id);

      if (!report.filePath) {
        res.status(404).json({ success: false, message: 'Report file not found' });
        return;
      }

      // Set appropriate headers
      const ext = report.format.toLowerCase();
      res.setHeader('Content-Type', this.getContentType(report.format));
      res.setHeader('Content-Disposition', `attachment; filename="${report.name}.${ext}"`);

      // Send file
      res.sendFile(report.filePath);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get content type for format
   */
  private getContentType(format: string): string {
    switch (format) {
      case 'PDF':
        return 'application/pdf';
      case 'EXCEL':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'CSV':
        return 'text/csv';
      default:
        return 'application/octet-stream';
    }
  }
}

export const reportController = new ReportController();
