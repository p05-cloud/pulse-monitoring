import { queues } from './queue.config';
import { logger } from '../../utils/logger';

export interface ReportJobData {
  scheduleId?: string;
  name: string;
  format: 'PDF' | 'EXCEL' | 'CSV';
  projectIds: string[];
  recipients: string[];
  startDate: string;
  endDate: string;
}

export class ReportQueue {
  /**
   * Add a report generation job to the queue
   */
  async addReportJob(data: ReportJobData) {
    try {
      const job = await queues.report.add('generate-report', data, {
        jobId: `report-${Date.now()}`,
        attempts: 2, // Retry once if fails
        backoff: {
          type: 'fixed',
          delay: 10000, // 10 seconds
        },
      });

      logger.debug(`Report job added: ${job.id}`);
      return job;
    } catch (error) {
      logger.error('Failed to add report job:', error);
      throw error;
    }
  }

  /**
   * Get queue stats
   */
  async getStats() {
    const waiting = await queues.report.getWaitingCount();
    const active = await queues.report.getActiveCount();
    const completed = await queues.report.getCompletedCount();
    const failed = await queues.report.getFailedCount();

    return { waiting, active, completed, failed };
  }
}

export const reportQueue = new ReportQueue();
