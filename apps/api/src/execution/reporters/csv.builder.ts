import { logger } from '../../utils/logger';
import type { ExecutiveSummary, MonitorReportData } from '../../director/reports/report.service';

export class CsvBuilder {
  /**
   * Generate CSV from executive summary
   */
  generateExecutiveSummary(summary: ExecutiveSummary): string {
    logger.info('Generating CSV executive summary report');

    const lines: string[] = [];

    // Header
    lines.push('PULSE Monitoring Report');
    lines.push(`Report Period:,${summary.reportPeriod.startDate.toLocaleDateString()} - ${summary.reportPeriod.endDate.toLocaleDateString()}`);
    lines.push('');

    // Executive Summary
    lines.push('Executive Summary');
    lines.push(`Total Monitors:,${summary.totalMonitors}`);
    lines.push(`Overall Uptime:,${summary.overallUptimePercentage.toFixed(2)}%`);
    lines.push(`Total Incidents:,${summary.totalIncidents}`);
    lines.push(`Total Downtime:,${this.formatDuration(summary.totalDowntimeSeconds)}`);
    lines.push(`Avg Response Time:,${summary.avgResponseTime}ms`);
    lines.push('');

    // Project Summary
    lines.push('Project Summary');
    lines.push('Project Name,Monitors,Uptime %,Incidents,Downtime');
    for (const project of summary.projects) {
      lines.push(
        `"${project.name}",${project.totalMonitors},${project.uptimePercentage.toFixed(2)}%,${project.totalIncidents},${this.formatDuration(project.totalDowntimeSeconds)}`
      );
    }
    lines.push('');

    // Monitor Details
    lines.push('Monitor Details');
    lines.push('Monitor Name,URL,Project,Total Checks,Successful,Failed,Uptime %,Avg Response,Min Response,Max Response,Incidents,Downtime');
    for (const project of summary.projects) {
      for (const monitor of project.monitors) {
        lines.push(
          `"${monitor.name}","${monitor.url}","${monitor.projectName}",${monitor.totalChecks},${monitor.successfulChecks},${monitor.failedChecks},${monitor.uptimePercentage.toFixed(2)}%,${monitor.avgResponseTime}ms,${monitor.minResponseTime}ms,${monitor.maxResponseTime}ms,${monitor.incidents},${this.formatDuration(monitor.totalDowntimeSeconds)}`
        );
      }
    }
    lines.push('');

    // Slowest Monitors
    if (summary.slowestMonitors.length > 0) {
      lines.push('Slowest Monitors (Top 10)');
      lines.push('Monitor Name,URL,Avg Response Time');
      for (const monitor of summary.slowestMonitors) {
        lines.push(`"${monitor.name}","${monitor.url}",${monitor.avgResponseTime}ms`);
      }
      lines.push('');
    }

    // Most Incidents
    if (summary.mostIncidents.length > 0) {
      lines.push('Monitors with Most Incidents (Top 10)');
      lines.push('Monitor Name,URL,Incidents');
      for (const monitor of summary.mostIncidents) {
        lines.push(`"${monitor.name}","${monitor.url}",${monitor.incidents}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Generate CSV from monitor data
   */
  generateMonitorReport(monitors: MonitorReportData[]): string {
    logger.info('Generating CSV monitor report');

    const lines: string[] = [];

    // Header
    lines.push('Monitor Report');
    lines.push('');

    // Data
    lines.push('Monitor Name,URL,Project,Total Checks,Successful,Failed,Uptime %,Avg Response,Min Response,Max Response,Incidents,Total Downtime');
    for (const monitor of monitors) {
      lines.push(
        `"${monitor.name}","${monitor.url}","${monitor.projectName}",${monitor.totalChecks},${monitor.successfulChecks},${monitor.failedChecks},${monitor.uptimePercentage.toFixed(2)}%,${monitor.avgResponseTime}ms,${monitor.minResponseTime}ms,${monitor.maxResponseTime}ms,${monitor.incidents},${this.formatDuration(monitor.totalDowntimeSeconds)}`
      );
    }

    return lines.join('\n');
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(seconds: number): string {
    if (seconds === 0) return '0s';
    if (seconds < 60) return `${seconds}s`;

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes < 60) {
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours < 24) {
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
}

export const csvBuilder = new CsvBuilder();
