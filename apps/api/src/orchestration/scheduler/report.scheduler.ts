import cron from 'node-cron';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { reportQueue } from '../queues/report.queue';

class ReportScheduler {
  private task: cron.ScheduledTask | null = null;

  /**
   * Start the report scheduler
   * Runs every hour to check for due reports
   */
  start() {
    if (this.task) {
      logger.warn('Report scheduler already running');
      return;
    }

    // Run every hour at minute 0
    this.task = cron.schedule('0 * * * *', async () => {
      await this.processScheduledReports();
    });

    logger.info('✅ Report scheduler started (runs hourly)');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('Report scheduler stopped');
    }
  }

  /**
   * Process all scheduled reports that are due
   */
  async processScheduledReports() {
    try {
      logger.debug('Checking for scheduled reports...');

      // Find all active schedules where nextRunAt is in the past
      const dueSchedules = await prisma.reportSchedule.findMany({
        where: {
          isActive: true,
          nextRunAt: {
            lte: new Date(),
          },
        },
      });

      if (dueSchedules.length === 0) {
        logger.debug('No scheduled reports due');
        return;
      }

      logger.info(`Found ${dueSchedules.length} scheduled reports to generate`);

      // Queue report generation for each due schedule
      for (const schedule of dueSchedules) {
        try {
          // Calculate report period based on frequency
          const { startDate, endDate } = this.calculateReportPeriod(schedule.frequency);

          await reportQueue.addReportJob({
            scheduleId: schedule.id,
            name: `${schedule.name} - ${new Date().toLocaleDateString()}`,
            format: schedule.format,
            projectIds: schedule.projectIds,
            recipients: schedule.recipients,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          });

          logger.info(`Queued scheduled report: ${schedule.name}`);
        } catch (error) {
          logger.error(`Failed to queue report for schedule ${schedule.id}:`, error);
          // Continue with other schedules
        }
      }
    } catch (error) {
      logger.error('Error processing scheduled reports:', error);
    }
  }

  /**
   * Calculate report period based on frequency
   */
  private calculateReportPeriod(frequency: string): { startDate: Date; endDate: Date } {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999); // End of today

    let startDate: Date;

    switch (frequency) {
      case 'DAILY':
        // Yesterday to today
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;

      case 'WEEKLY':
        // Last 7 days
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;

      case 'MONTHLY':
        // Last month
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;

      default:
        // Default to last 7 days
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
    }

    return { startDate, endDate };
  }

  /**
   * Manually trigger a scheduled report
   */
  async triggerSchedule(scheduleId: string) {
    const schedule = await prisma.reportSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new Error(`Report schedule ${scheduleId} not found`);
    }

    const { startDate, endDate } = this.calculateReportPeriod(schedule.frequency);

    await reportQueue.addReportJob({
      scheduleId: schedule.id,
      name: `${schedule.name} - Manual Run - ${new Date().toLocaleDateString()}`,
      format: schedule.format,
      projectIds: schedule.projectIds,
      recipients: schedule.recipients,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    logger.info(`Manually triggered report schedule: ${schedule.name}`);
  }
}

export const reportScheduler = new ReportScheduler();
