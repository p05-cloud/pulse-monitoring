import { Worker, Job } from 'bullmq';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { redis } from '../../config/redis';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { reportService } from '../../director/reports/report.service';
import { csvBuilder } from '../reporters/csv.builder';
import { emailNotifier } from '../notifiers/email.notifier';
import type { ReportJobData } from '../../orchestration/queues/report.queue';

class ReportWorker {
  private worker: Worker;
  private reportsDir: string;

  constructor() {
    // Set up reports directory
    this.reportsDir = join(process.cwd(), 'reports');
    if (!existsSync(this.reportsDir)) {
      mkdirSync(this.reportsDir, { recursive: true });
    }

    this.worker = new Worker(
      'report-queue',
      async (job: Job<ReportJobData>) => {
        return this.processReport(job);
      },
      {
        connection: redis,
        concurrency: 2, // Process up to 2 reports simultaneously
      }
    );

    this.setupEventHandlers();
    logger.info('✅ Report worker started');
  }

  /**
   * Process a report generation job
   */
  private async processReport(job: Job<ReportJobData>) {
    const data = job.data;
    logger.info(`Processing report job ${job.id}: ${data.name}`);

    try {
      // Create report record
      const reportRecord = await prisma.generatedReport.create({
        data: {
          scheduleId: data.scheduleId,
          name: data.name,
          format: data.format,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          status: 'GENERATING',
        },
      });

      // Generate report data
      const summary = await reportService.generateExecutiveSummary(
        {
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
        },
        data.projectIds.length > 0 ? data.projectIds : undefined
      );

      // Generate file based on format
      let filePath: string;
      let fileSize: number;

      switch (data.format) {
        case 'CSV':
          ({ filePath, fileSize } = await this.generateCsvReport(reportRecord.id, summary));
          break;
        case 'PDF':
          // PDF generation requires PDFKit - placeholder for now
          ({ filePath, fileSize } = await this.generatePlaceholderReport(reportRecord.id, 'PDF', summary));
          break;
        case 'EXCEL':
          // Excel generation requires ExcelJS - placeholder for now
          ({ filePath, fileSize } = await this.generatePlaceholderReport(reportRecord.id, 'EXCEL', summary));
          break;
        default:
          throw new Error(`Unsupported format: ${data.format}`);
      }

      // Update report record
      await prisma.generatedReport.update({
        where: { id: reportRecord.id },
        data: {
          status: 'COMPLETED',
          filePath,
          fileSize,
        },
      });

      // Send report via email if recipients specified
      if (data.recipients && data.recipients.length > 0) {
        await this.emailReport(data, filePath);
      }

      // Update schedule last run time if this was a scheduled report
      if (data.scheduleId) {
        const schedule = await prisma.reportSchedule.findUnique({
          where: { id: data.scheduleId },
        });

        if (schedule) {
          const nextRunAt = reportService['calculateNextRunTime'](schedule.frequency);

          await prisma.reportSchedule.update({
            where: { id: data.scheduleId },
            data: {
              lastRunAt: new Date(),
              nextRunAt,
            },
          });
        }
      }

      logger.info(`Report generated successfully: ${reportRecord.id}`);
      return { success: true, reportId: reportRecord.id, filePath };
    } catch (error: any) {
      logger.error('Failed to generate report:', error);

      // Update report record as failed
      try {
        await prisma.generatedReport.updateMany({
          where: {
            name: data.name,
            status: 'GENERATING',
          },
          data: {
            status: 'FAILED',
          },
        });
      } catch (updateError) {
        logger.error('Failed to update report status:', updateError);
      }

      throw error;
    }
  }

  /**
   * Generate CSV report
   */
  private async generateCsvReport(
    reportId: string,
    summary: any
  ): Promise<{ filePath: string; fileSize: number }> {
    const csv = csvBuilder.generateExecutiveSummary(summary);
    const fileName = `report-${reportId}.csv`;
    const filePath = join(this.reportsDir, fileName);

    writeFileSync(filePath, csv, 'utf-8');
    const fileSize = Buffer.byteLength(csv, 'utf-8');

    return { filePath, fileSize };
  }

  /**
   * Generate placeholder report (for PDF/Excel when dependencies not installed)
   */
  private async generatePlaceholderReport(
    reportId: string,
    format: string,
    summary: any
  ): Promise<{ filePath: string; fileSize: number }> {
    // For now, generate CSV as fallback
    logger.warn(`${format} generation not yet implemented, generating CSV instead`);

    const csv = csvBuilder.generateExecutiveSummary(summary);
    const fileName = `report-${reportId}.${format.toLowerCase()}.csv`;
    const filePath = join(this.reportsDir, fileName);

    writeFileSync(filePath, csv, 'utf-8');
    const fileSize = Buffer.byteLength(csv, 'utf-8');

    return { filePath, fileSize };
  }

  /**
   * Email report to recipients
   */
  private async emailReport(data: ReportJobData, _filePath: string) {
    logger.info(`Emailing report to ${data.recipients.length} recipients`);

    // Send email to each recipient
    // Note: This is a simplified version. In production, you'd want to:
    // 1. Include the report as an attachment
    // 2. Use a proper email template
    // 3. Handle failures gracefully

    for (const recipient of data.recipients) {
      try {
        await emailNotifier['send']({
          to: recipient,
          subject: `[PULSE] ${data.name} - Report Ready`,
          html: `
            <h2>Your PULSE Report is Ready</h2>
            <p>Report Name: ${data.name}</p>
            <p>Period: ${new Date(data.startDate).toLocaleDateString()} - ${new Date(data.endDate).toLocaleDateString()}</p>
            <p>Format: ${data.format}</p>
            <p>The report has been generated and is available for download from your PULSE dashboard.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/reports">View Reports</a>
          `,
          monitorName: '',
          monitorUrl: '',
        });
      } catch (error) {
        logger.error(`Failed to send report email to ${recipient}:`, error);
        // Continue with other recipients
      }
    }
  }

  /**
   * Set up event handlers
   */
  private setupEventHandlers() {
    this.worker.on('completed', (job) => {
      logger.info(`Report job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, error) => {
      if (job) {
        logger.error(`Report job ${job.id} failed:`, error);
      }
    });

    this.worker.on('error', (error) => {
      logger.error('Report worker error:', error);
    });
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('Shutting down report worker...');
    await this.worker.close();
    logger.info('Report worker shut down successfully');
  }
}

// Export singleton instance
export const reportWorker = new ReportWorker();

// Graceful shutdown on process termination
process.on('SIGTERM', async () => {
  await reportWorker.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await reportWorker.shutdown();
  process.exit(0);
});
