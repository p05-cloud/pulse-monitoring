import { queues } from './queue.config';
import { logger } from '../../utils/logger';

export interface CheckJobData {
  monitorId: string;
  url: string;
  method: string;
  timeoutMs: number;
  expectedStatus: number;
  keyword?: string;
  headers?: Record<string, string>;
}

export class CheckQueue {
  /**
   * Add a check job to the queue
   */
  async addCheckJob(data: CheckJobData) {
    try {
      const job = await queues.check.add('check-monitor', data, {
        jobId: `check-${data.monitorId}-${Date.now()}`,
      });

      logger.debug(`Check job added for monitor ${data.monitorId}`);
      return job;
    } catch (error) {
      logger.error(`Failed to add check job for monitor ${data.monitorId}:`, error);
      throw error;
    }
  }

  /**
   * Add multiple check jobs in bulk
   */
  async addBulkCheckJobs(jobs: CheckJobData[]) {
    try {
      const bulkJobs = jobs.map((data) => ({
        name: 'check-monitor',
        data,
        opts: {
          jobId: `check-${data.monitorId}-${Date.now()}`,
        },
      }));

      await queues.check.addBulk(bulkJobs);
      logger.info(`Added ${jobs.length} check jobs to queue`);
    } catch (error) {
      logger.error('Failed to add bulk check jobs:', error);
      throw error;
    }
  }

  /**
   * Get queue stats
   */
  async getStats() {
    const waiting = await queues.check.getWaitingCount();
    const active = await queues.check.getActiveCount();
    const completed = await queues.check.getCompletedCount();
    const failed = await queues.check.getFailedCount();

    return { waiting, active, completed, failed };
  }
}

export const checkQueue = new CheckQueue();
