import { queues } from './queue.config';
import { logger } from '../../utils/logger';

export interface NotificationJobData {
  incidentId: string;
  alertContactId: string;
  type: 'DOWN' | 'UP' | 'DEGRADED' | 'ACKNOWLEDGED';
  monitorName: string;
  monitorUrl: string;
  projectName?: string;
  errorMessage?: string;
  errorCategory?: string;
  timestamp: string;
  duration?: number;
  rcaDetails?: any;
}

export class NotificationQueue {
  /**
   * Add a notification job to the queue
   */
  async addNotificationJob(data: NotificationJobData) {
    try {
      const job = await queues.notification.add('send-notification', data, {
        jobId: `notification-${data.incidentId}-${data.alertContactId}-${Date.now()}`,
        attempts: 3, // Retry up to 3 times
        backoff: {
          type: 'exponential',
          delay: 5000, // Start with 5 seconds
        },
      });

      logger.debug(`Notification job added for incident ${data.incidentId}`);
      return job;
    } catch (error) {
      logger.error(`Failed to add notification job for incident ${data.incidentId}:`, error);
      throw error;
    }
  }

  /**
   * Add multiple notification jobs in bulk
   */
  async addBulkNotificationJobs(jobs: NotificationJobData[]) {
    try {
      const bulkJobs = jobs.map((data) => ({
        name: 'send-notification',
        data,
        opts: {
          jobId: `notification-${data.incidentId}-${data.alertContactId}-${Date.now()}`,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      }));

      await queues.notification.addBulk(bulkJobs);
      logger.info(`Added ${jobs.length} notification jobs to queue`);
    } catch (error) {
      logger.error('Failed to add bulk notification jobs:', error);
      throw error;
    }
  }

  /**
   * Get queue stats
   */
  async getStats() {
    const waiting = await queues.notification.getWaitingCount();
    const active = await queues.notification.getActiveCount();
    const completed = await queues.notification.getCompletedCount();
    const failed = await queues.notification.getFailedCount();

    return { waiting, active, completed, failed };
  }
}

export const notificationQueue = new NotificationQueue();
