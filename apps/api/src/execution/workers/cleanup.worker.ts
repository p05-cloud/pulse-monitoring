import cron from 'node-cron';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { maintenanceService } from '../../director/maintenance/maintenance.service';

class CleanupWorker {
  private task: cron.ScheduledTask | null = null;

  /**
   * Start the cleanup worker
   * Runs daily at 2 AM to clean up old data
   */
  start() {
    if (this.task) {
      logger.warn('Cleanup worker already running');
      return;
    }

    // Run daily at 2:00 AM
    this.task = cron.schedule('0 2 * * *', async () => {
      await this.runCleanup();
    });

    logger.info('✅ Cleanup worker started (runs daily at 2 AM)');
  }

  /**
   * Stop the worker
   */
  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('Cleanup worker stopped');
    }
  }

  /**
   * Run all cleanup tasks
   */
  async runCleanup() {
    logger.info('Starting cleanup process...');

    try {
      // Cleanup old check results (keep last 7 days)
      await this.cleanupCheckResults(7);

      // Cleanup old activity logs (keep last 90 days)
      await this.cleanupActivityLogs(90);

      // Cleanup old notification logs (keep last 30 days)
      await this.cleanupNotificationLogs(30);

      // Cleanup expired maintenance windows
      await maintenanceService.cleanupExpired();

      // Cleanup old generated reports (keep last 30 days)
      await this.cleanupGeneratedReports(30);

      // Cleanup failed queue jobs (keep last 7 days)
      await this.cleanupQueueJobs(7);

      logger.info('✅ Cleanup process completed successfully');
    } catch (error) {
      logger.error('Error during cleanup process:', error);
    }
  }

  /**
   * Clean up old check results
   */
  private async cleanupCheckResults(days: number) {
    logger.info(`Cleaning up check results older than ${days} days...`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.checkResult.deleteMany({
      where: {
        checkedAt: {
          lt: cutoffDate,
        },
      },
    });

    logger.info(`Deleted ${result.count} old check results`);
  }

  /**
   * Clean up old activity logs
   */
  private async cleanupActivityLogs(days: number) {
    logger.info(`Cleaning up activity logs older than ${days} days...`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.activityLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    logger.info(`Deleted ${result.count} old activity logs`);
  }

  /**
   * Clean up old notification logs
   */
  private async cleanupNotificationLogs(days: number) {
    logger.info(`Cleaning up notification logs older than ${days} days...`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.notificationLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    logger.info(`Deleted ${result.count} old notification logs`);
  }

  /**
   * Clean up old generated reports
   */
  private async cleanupGeneratedReports(days: number) {
    logger.info(`Cleaning up generated reports older than ${days} days...`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // TODO: Also delete physical report files from disk/S3

    const result = await prisma.generatedReport.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        status: {
          in: ['COMPLETED', 'FAILED'],
        },
      },
    });

    logger.info(`Deleted ${result.count} old generated reports`);
  }

  /**
   * Clean up old queue jobs (from BullMQ)
   */
  private async cleanupQueueJobs(days: number) {
    logger.info(`Cleaning up queue jobs older than ${days} days...`);

    // BullMQ has built-in cleanup options in queue configuration
    // This is a placeholder for additional cleanup if needed

    logger.info('Queue cleanup handled by BullMQ configuration');
  }

  /**
   * Get cleanup statistics
   */
  async getStats() {
    const now = new Date();

    // Count records older than retention periods
    const checkResultsCount = await prisma.checkResult.count({
      where: {
        checkedAt: {
          lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const activityLogsCount = await prisma.activityLog.count({
      where: {
        createdAt: {
          lt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const notificationLogsCount = await prisma.notificationLog.count({
      where: {
        createdAt: {
          lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    return {
      checkResults: {
        total: await prisma.checkResult.count(),
        toBeDeleted: checkResultsCount,
      },
      activityLogs: {
        total: await prisma.activityLog.count(),
        toBeDeleted: activityLogsCount,
      },
      notificationLogs: {
        total: await prisma.notificationLog.count(),
        toBeDeleted: notificationLogsCount,
      },
    };
  }

  /**
   * Manually trigger cleanup
   */
  async triggerCleanup() {
    logger.info('Manually triggering cleanup process');
    await this.runCleanup();
  }
}

export const cleanupWorker = new CleanupWorker();

// Graceful shutdown on process termination
process.on('SIGTERM', () => {
  cleanupWorker.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  cleanupWorker.stop();
  process.exit(0);
});
