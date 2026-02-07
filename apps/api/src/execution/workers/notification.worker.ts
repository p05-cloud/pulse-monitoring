import { Worker, Job } from 'bullmq';
import { redis } from '../../config/redis';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { emailNotifier } from '../notifiers/email.notifier';
import { teamsNotifier } from '../notifiers/teams.notifier';
import { webhookNotifier } from '../notifiers/webhook.notifier';
import type { NotificationJobData } from '../../orchestration/queues/notification.queue';

class NotificationWorker {
  private worker: Worker;

  constructor() {
    this.worker = new Worker(
      'notification-queue',
      async (job: Job<NotificationJobData>) => {
        return this.processNotification(job);
      },
      {
        connection: redis,
        concurrency: 5, // Process up to 5 notifications simultaneously
        limiter: {
          max: 10, // Max 10 jobs
          duration: 1000, // per 1 second
        },
      }
    );

    this.setupEventHandlers();
    logger.info('✅ Notification worker started');
  }

  /**
   * Process a notification job
   */
  private async processNotification(job: Job<NotificationJobData>) {
    const data = job.data;
    logger.info(`Processing notification job ${job.id} for incident ${data.incidentId}`);

    try {
      // Get alert contact details from database
      const alertContact = await prisma.alertContact.findUnique({
        where: { id: data.alertContactId },
      });

      if (!alertContact) {
        throw new Error(`Alert contact ${data.alertContactId} not found`);
      }

      if (!alertContact.isActive) {
        logger.info(`Alert contact ${data.alertContactId} is inactive, skipping`);
        return { success: true, skipped: true };
      }

      // Create notification log entry
      const notificationLog = await prisma.notificationLog.create({
        data: {
          incidentId: data.incidentId,
          alertContactId: data.alertContactId,
          type: data.type,
          status: 'PENDING',
          retryCount: job.attemptsMade,
        },
      });

      // Route to appropriate notifier based on type
      let result;
      switch (alertContact.type) {
        case 'EMAIL':
          result = await this.sendEmailNotification(alertContact.config, data);
          break;
        case 'TEAMS':
          result = await this.sendTeamsNotification(alertContact.config, data);
          break;
        case 'WEBHOOK':
          result = await this.sendWebhookNotification(alertContact.config, data);
          break;
        case 'SLACK':
          // Slack implementation similar to Teams (future enhancement)
          throw new Error('Slack notifications not yet implemented');
        default:
          throw new Error(`Unknown alert contact type: ${alertContact.type}`);
      }

      // Update notification log as sent
      await prisma.notificationLog.update({
        where: { id: notificationLog.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      logger.info(`Notification sent successfully for incident ${data.incidentId}`);
      return { success: true, ...result };
    } catch (error: any) {
      logger.error(`Failed to send notification for incident ${data.incidentId}:`, error);

      // Update notification log as failed
      try {
        await prisma.notificationLog.updateMany({
          where: {
            incidentId: data.incidentId,
            alertContactId: data.alertContactId,
            status: 'PENDING',
          },
          data: {
            status: 'FAILED',
            errorMessage: error.message,
          },
        });
      } catch (logError) {
        logger.error('Failed to update notification log:', logError);
      }

      throw error; // Re-throw to trigger retry
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    config: any,
    data: NotificationJobData
  ) {
    const emailConfig = config as { email: string };

    switch (data.type) {
      case 'DOWN':
        return emailNotifier.sendDownNotification({
          to: emailConfig.email,
          monitorName: data.monitorName,
          monitorUrl: data.monitorUrl,
          projectName: data.projectName,
          errorMessage: data.errorMessage,
          errorCategory: data.errorCategory,
          timestamp: data.timestamp,
          rcaDetails: data.rcaDetails,
        });
      case 'UP':
        return emailNotifier.sendUpNotification({
          to: emailConfig.email,
          monitorName: data.monitorName,
          monitorUrl: data.monitorUrl,
          projectName: data.projectName,
          timestamp: data.timestamp,
          duration: data.duration,
        });
      case 'DEGRADED':
        return emailNotifier.sendDegradedNotification({
          to: emailConfig.email,
          monitorName: data.monitorName,
          monitorUrl: data.monitorUrl,
          projectName: data.projectName,
          timestamp: data.timestamp,
        });
      default:
        throw new Error(`Unknown notification type: ${data.type}`);
    }
  }

  /**
   * Send Teams notification
   */
  private async sendTeamsNotification(
    config: any,
    data: NotificationJobData
  ) {
    const teamsConfig = config as { webhookUrl: string };

    switch (data.type) {
      case 'DOWN':
        return teamsNotifier.sendDownNotification({
          webhookUrl: teamsConfig.webhookUrl,
          monitorName: data.monitorName,
          monitorUrl: data.monitorUrl,
          projectName: data.projectName,
          errorMessage: data.errorMessage,
          errorCategory: data.errorCategory,
          timestamp: data.timestamp,
          rcaDetails: data.rcaDetails,
        });
      case 'UP':
        return teamsNotifier.sendUpNotification({
          webhookUrl: teamsConfig.webhookUrl,
          monitorName: data.monitorName,
          monitorUrl: data.monitorUrl,
          projectName: data.projectName,
          timestamp: data.timestamp,
          duration: data.duration,
        });
      case 'DEGRADED':
        return teamsNotifier.sendDegradedNotification({
          webhookUrl: teamsConfig.webhookUrl,
          monitorName: data.monitorName,
          monitorUrl: data.monitorUrl,
          projectName: data.projectName,
          timestamp: data.timestamp,
        });
      default:
        throw new Error(`Unknown notification type: ${data.type}`);
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(
    config: any,
    data: NotificationJobData
  ) {
    const webhookConfig = config as { url: string; headers?: Record<string, string>; method?: 'POST' | 'PUT' | 'PATCH' };

    // Get monitor details for webhook payload
    const monitor = await prisma.monitor.findFirst({
      where: { url: data.monitorUrl },
      select: { id: true },
    });

    const monitorId = monitor?.id || 'unknown';

    switch (data.type) {
      case 'DOWN':
        return webhookNotifier.sendDownNotification(webhookConfig, {
          monitorId,
          monitorName: data.monitorName,
          monitorUrl: data.monitorUrl,
          projectName: data.projectName,
          errorMessage: data.errorMessage,
          errorCategory: data.errorCategory,
          timestamp: data.timestamp,
          rcaDetails: data.rcaDetails,
        });
      case 'UP':
        return webhookNotifier.sendUpNotification(webhookConfig, {
          monitorId,
          monitorName: data.monitorName,
          monitorUrl: data.monitorUrl,
          projectName: data.projectName,
          timestamp: data.timestamp,
          duration: data.duration,
        });
      case 'DEGRADED':
        return webhookNotifier.sendDegradedNotification(webhookConfig, {
          monitorId,
          monitorName: data.monitorName,
          monitorUrl: data.monitorUrl,
          projectName: data.projectName,
          timestamp: data.timestamp,
        });
      default:
        throw new Error(`Unknown notification type: ${data.type}`);
    }
  }

  /**
   * Set up event handlers
   */
  private setupEventHandlers() {
    this.worker.on('completed', (job) => {
      logger.info(`Notification job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, error) => {
      if (job) {
        logger.error(`Notification job ${job.id} failed after ${job.attemptsMade} attempts:`, error);
      }
    });

    this.worker.on('error', (error) => {
      logger.error('Notification worker error:', error);
    });
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('Shutting down notification worker...');
    await this.worker.close();
    logger.info('Notification worker shut down successfully');
  }
}

// Export singleton instance
export const notificationWorker = new NotificationWorker();

// Graceful shutdown on process termination
process.on('SIGTERM', async () => {
  await notificationWorker.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await notificationWorker.shutdown();
  process.exit(0);
});
