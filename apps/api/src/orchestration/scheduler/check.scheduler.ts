import cron from 'node-cron';
import { prisma } from '../../config/database';
import { checkQueue } from '../queues/check.queue';
import { logger } from '../../utils/logger';

export class CheckScheduler {
  private task: cron.ScheduledTask | null = null;

  /**
   * Start the check scheduler
   * Runs every minute to dispatch checks
   */
  start() {
    // Run every minute
    this.task = cron.schedule('* * * * *', async () => {
      await this.scheduleChecks();
    });

    logger.info('✅ Check scheduler started (runs every minute)');
  }

  /**
   * Schedule checks for all active monitors that are due
   */
  private async scheduleChecks() {
    try {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

      // Find monitors that:
      // 1. Are active
      // 2. Haven't been checked in the last interval (or never checked)
      const monitors = await prisma.monitor.findMany({
        where: {
          isActive: true,
          OR: [
            // Never checked
            { lastCheckAt: null },
            // Due for check based on interval
            {
              lastCheckAt: {
                lte: oneMinuteAgo, // At least 1 minute ago
              },
            },
          ],
        },
      });

      if (monitors.length === 0) {
        logger.debug('No monitors due for checking');
        return;
      }

      // Filter monitors based on their specific intervals
      const monitorsToCheck = monitors.filter((monitor) => {
        if (!monitor.lastCheckAt) {
          return true; // Never checked, check now
        }

        const timeSinceLastCheck = Math.floor(
          (now.getTime() - monitor.lastCheckAt.getTime()) / 1000
        );

        return timeSinceLastCheck >= monitor.intervalSeconds;
      });

      if (monitorsToCheck.length === 0) {
        logger.debug('No monitors due for checking after interval filter');
        return;
      }

      // Create check jobs
      const jobs = monitorsToCheck.map((monitor) => ({
        monitorId: monitor.id,
        url: monitor.url,
        method: monitor.method,
        timeoutMs: monitor.timeoutMs,
        expectedStatus: monitor.expectedStatus,
        keyword: monitor.keyword || undefined,
        headers: (monitor.headers as Record<string, string>) || undefined,
        body: monitor.body || undefined,
      }));

      await checkQueue.addBulkCheckJobs(jobs);

      logger.info(`📋 Scheduled ${jobs.length} checks`);
    } catch (error) {
      logger.error('Error scheduling checks:', error);
    }
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.task) {
      this.task.stop();
      logger.info('Check scheduler stopped');
    }
  }

  /**
   * Manually trigger check scheduling (for testing)
   */
  async triggerNow() {
    logger.info('Manually triggering check scheduling...');
    await this.scheduleChecks();
  }
}

export const checkScheduler = new CheckScheduler();
