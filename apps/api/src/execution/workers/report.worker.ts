import { Worker, Job } from 'bullmq';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
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
          ({ filePath, fileSize } = await this.generatePdfReport(reportRecord.id, summary));
          break;
        case 'EXCEL':
          ({ filePath, fileSize } = await this.generateExcelReport(reportRecord.id, summary));
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
   * Generate PDF report using PDFKit
   */
  private async generatePdfReport(
    reportId: string,
    summary: any
  ): Promise<{ filePath: string; fileSize: number }> {
    const fileName = `report-${reportId}.pdf`;
    const filePath = join(this.reportsDir, fileName);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        writeFileSync(filePath, buffer);
        resolve({ filePath, fileSize: buffer.length });
      });
      doc.on('error', reject);

      const period = summary.reportPeriod;
      const startStr = new Date(period.startDate).toLocaleDateString();
      const endStr = new Date(period.endDate).toLocaleDateString();

      // Header
      doc.fontSize(22).font('Helvetica-Bold').text('PULSE Monitoring Report', { align: 'center' });
      doc.fontSize(11).font('Helvetica').text(`Period: ${startStr} — ${endStr}`, { align: 'center' });
      doc.moveDown(1.5);

      // Executive Summary
      doc.fontSize(14).font('Helvetica-Bold').text('Executive Summary');
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      doc.text(`Total Monitors: ${summary.totalMonitors}`);
      doc.text(`Overall Uptime: ${summary.overallUptimePercentage}%`);
      doc.text(`Average Response Time: ${summary.avgResponseTime}ms`);
      doc.text(`Total Incidents: ${summary.totalIncidents}`);
      doc.text(`Total Downtime: ${Math.round(summary.totalDowntimeSeconds / 60)} minutes`);
      doc.moveDown(1.5);

      // Monitor Details Table
      doc.fontSize(14).font('Helvetica-Bold').text('Monitor Details');
      doc.moveDown(0.5);

      const colWidths = [160, 65, 75, 65, 60];
      const headers = ['Monitor', 'Uptime %', 'Avg Resp (ms)', 'Incidents', 'Project'];
      const tableLeft = doc.page.margins.left;
      let y = doc.y;

      // Table header
      doc.fontSize(9).font('Helvetica-Bold');
      headers.forEach((h, i) => {
        const x = tableLeft + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.text(h, x, y, { width: colWidths[i] });
      });
      y += 16;
      doc.moveTo(tableLeft, y).lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), y).stroke();
      y += 4;

      // Table rows
      doc.font('Helvetica').fontSize(8);
      for (const project of summary.projects) {
        for (const monitor of project.monitors) {
          if (y > doc.page.height - doc.page.margins.bottom - 20) {
            doc.addPage();
            y = doc.page.margins.top;
          }
          const row = [
            monitor.name.slice(0, 28),
            `${monitor.uptimePercentage}%`,
            `${monitor.avgResponseTime}`,
            `${monitor.incidents}`,
            project.name.slice(0, 18),
          ];
          row.forEach((cell, i) => {
            const x = tableLeft + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
            doc.text(cell, x, y, { width: colWidths[i] });
          });
          y += 14;
        }
      }

      doc.moveDown(2);

      // Footer
      doc.fontSize(9).font('Helvetica').fillColor('grey')
        .text(`Generated by PULSE Monitoring on ${new Date().toLocaleString()}`, { align: 'center' });

      doc.end();
    });
  }

  /**
   * Generate Excel report using ExcelJS
   */
  private async generateExcelReport(
    reportId: string,
    summary: any
  ): Promise<{ filePath: string; fileSize: number }> {
    const fileName = `report-${reportId}.xlsx`;
    const filePath = join(this.reportsDir, fileName);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'PULSE Monitoring';
    workbook.created = new Date();

    const period = summary.reportPeriod;
    const startStr = new Date(period.startDate).toLocaleDateString();
    const endStr = new Date(period.endDate).toLocaleDateString();

    // ── Sheet 1: Summary ──────────────────────────────────────────────────────
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 },
    ];

    summarySheet.getRow(1).font = { bold: true };
    summarySheet.addRows([
      { metric: 'Report Period', value: `${startStr} — ${endStr}` },
      { metric: 'Total Monitors', value: summary.totalMonitors },
      { metric: 'Overall Uptime %', value: `${summary.overallUptimePercentage}%` },
      { metric: 'Average Response Time (ms)', value: summary.avgResponseTime },
      { metric: 'Total Incidents', value: summary.totalIncidents },
      { metric: 'Total Downtime (minutes)', value: Math.round(summary.totalDowntimeSeconds / 60) },
    ]);

    // ── Sheet 2: Monitor Details ──────────────────────────────────────────────
    const detailSheet = workbook.addWorksheet('Monitor Details');
    detailSheet.columns = [
      { header: 'Project', key: 'project', width: 20 },
      { header: 'Monitor Name', key: 'name', width: 30 },
      { header: 'URL', key: 'url', width: 40 },
      { header: 'Uptime %', key: 'uptime', width: 12 },
      { header: 'Avg Response (ms)', key: 'avgResponse', width: 18 },
      { header: 'Min Response (ms)', key: 'minResponse', width: 18 },
      { header: 'Max Response (ms)', key: 'maxResponse', width: 18 },
      { header: 'Total Checks', key: 'totalChecks', width: 14 },
      { header: 'Failed Checks', key: 'failedChecks', width: 14 },
      { header: 'Incidents', key: 'incidents', width: 12 },
      { header: 'Downtime (min)', key: 'downtime', width: 15 },
    ];

    const headerRow = detailSheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    for (const project of summary.projects) {
      for (const monitor of project.monitors) {
        const row = detailSheet.addRow({
          project: project.name,
          name: monitor.name,
          url: monitor.url,
          uptime: monitor.uptimePercentage,
          avgResponse: monitor.avgResponseTime,
          minResponse: monitor.minResponseTime,
          maxResponse: monitor.maxResponseTime,
          totalChecks: monitor.totalChecks,
          failedChecks: monitor.failedChecks,
          incidents: monitor.incidents,
          downtime: Math.round(monitor.totalDowntimeSeconds / 60),
        });

        // Colour uptime cell: green >= 99.9%, yellow >= 99%, red below
        const uptimeCell = row.getCell('uptime');
        const uptime = monitor.uptimePercentage as number;
        if (uptime >= 99.9) {
          uptimeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };
        } else if (uptime >= 99) {
          uptimeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } };
        } else {
          uptimeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } };
          uptimeCell.font = { color: { argb: 'FFFFFFFF' } };
        }
      }
    }

    await workbook.xlsx.writeFile(filePath);
    const { statSync } = await import('fs');
    const fileSize = statSync(filePath).size;

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
