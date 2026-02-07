import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { MonitorStatus, IncidentStatus } from '@prisma/client';

export interface ReportPeriod {
  startDate: Date;
  endDate: Date;
}

export interface MonitorReportData {
  id: string;
  name: string;
  url: string;
  projectName: string;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  uptimePercentage: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  incidents: number;
  totalDowntimeSeconds: number;
}

export interface ProjectReportData {
  id: string;
  name: string;
  totalMonitors: number;
  uptimePercentage: number;
  totalIncidents: number;
  totalDowntimeSeconds: number;
  monitors: MonitorReportData[];
}

export interface ExecutiveSummary {
  reportPeriod: ReportPeriod;
  totalMonitors: number;
  overallUptimePercentage: number;
  totalIncidents: number;
  totalDowntimeSeconds: number;
  avgResponseTime: number;
  projects: ProjectReportData[];
  slowestMonitors: Array<{ name: string; url: string; avgResponseTime: number }>;
  mostIncidents: Array<{ name: string; url: string; incidents: number }>;
}

export class ReportService {
  /**
   * Generate executive summary report
   */
  async generateExecutiveSummary(period: ReportPeriod, projectIds?: string[]): Promise<ExecutiveSummary> {
    logger.info(`Generating executive summary for ${period.startDate} to ${period.endDate}`);

    // Build project filter
    const projectFilter = projectIds && projectIds.length > 0 ? { id: { in: projectIds } } : {};

    // Get all monitors for projects
    const monitors = await prisma.monitor.findMany({
      where: {
        project: projectFilter,
      },
      include: {
        project: true,
      },
    });

    // Calculate monitor-level stats
    const monitorReports = await Promise.all(
      monitors.map((monitor) => this.generateMonitorReport(monitor.id, period))
    );

    // Group by project
    const projectsMap = new Map<string, ProjectReportData>();

    for (const monitorReport of monitorReports) {
      const monitor = monitors.find((m) => m.id === monitorReport.id);
      if (!monitor) continue;

      const projectId = monitor.projectId;
      if (!projectsMap.has(projectId)) {
        projectsMap.set(projectId, {
          id: projectId,
          name: monitor.project.name,
          totalMonitors: 0,
          uptimePercentage: 0,
          totalIncidents: 0,
          totalDowntimeSeconds: 0,
          monitors: [],
        });
      }

      const projectData = projectsMap.get(projectId)!;
      projectData.totalMonitors++;
      projectData.totalIncidents += monitorReport.incidents;
      projectData.totalDowntimeSeconds += monitorReport.totalDowntimeSeconds;
      projectData.monitors.push(monitorReport);
    }

    // Calculate project uptime percentages
    for (const project of projectsMap.values()) {
      const totalUptime = project.monitors.reduce((sum, m) => sum + m.uptimePercentage, 0);
      project.uptimePercentage = project.totalMonitors > 0 ? totalUptime / project.totalMonitors : 100;
    }

    // Calculate overall stats
    const totalMonitors = monitors.length;
    const overallUptime =
      monitorReports.reduce((sum, m) => sum + m.uptimePercentage, 0) / Math.max(totalMonitors, 1);
    const totalIncidents = monitorReports.reduce((sum, m) => sum + m.incidents, 0);
    const totalDowntime = monitorReports.reduce((sum, m) => sum + m.totalDowntimeSeconds, 0);
    const avgResponseTime =
      monitorReports.reduce((sum, m) => sum + m.avgResponseTime, 0) / Math.max(totalMonitors, 1);

    // Get slowest monitors (top 10)
    const slowestMonitors = [...monitorReports]
      .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
      .slice(0, 10)
      .map((m) => ({
        name: m.name,
        url: m.url,
        avgResponseTime: Math.round(m.avgResponseTime),
      }));

    // Get monitors with most incidents (top 10)
    const mostIncidents = [...monitorReports]
      .sort((a, b) => b.incidents - a.incidents)
      .slice(0, 10)
      .filter((m) => m.incidents > 0)
      .map((m) => ({
        name: m.name,
        url: m.url,
        incidents: m.incidents,
      }));

    return {
      reportPeriod: period,
      totalMonitors,
      overallUptimePercentage: Math.round(overallUptime * 100) / 100,
      totalIncidents,
      totalDowntimeSeconds: Math.round(totalDowntime),
      avgResponseTime: Math.round(avgResponseTime),
      projects: Array.from(projectsMap.values()),
      slowestMonitors,
      mostIncidents,
    };
  }

  /**
   * Generate report for a single monitor
   */
  async generateMonitorReport(monitorId: string, period: ReportPeriod): Promise<MonitorReportData> {
    const monitor = await prisma.monitor.findUnique({
      where: { id: monitorId },
      include: { project: true },
    });

    if (!monitor) {
      throw new Error(`Monitor ${monitorId} not found`);
    }

    // Get check results in period
    const checks = await prisma.checkResult.findMany({
      where: {
        monitorId,
        checkedAt: {
          gte: period.startDate,
          lte: period.endDate,
        },
      },
    });

    // Get incidents in period
    const incidents = await prisma.incident.findMany({
      where: {
        monitorId,
        startedAt: {
          gte: period.startDate,
          lte: period.endDate,
        },
      },
    });

    // Calculate stats
    const totalChecks = checks.length;
    const successfulChecks = checks.filter((c) => c.success).length;
    const failedChecks = totalChecks - successfulChecks;
    const uptimePercentage = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 100;

    // Response time stats (only successful checks)
    const responseTimes = checks
      .filter((c) => c.success && c.responseTimeMs !== null)
      .map((c) => c.responseTimeMs!);

    const avgResponseTime =
      responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;

    const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
    const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;

    // Total downtime from incidents
    const totalDowntimeSeconds = incidents.reduce(
      (sum, inc) => sum + (inc.durationSeconds || 0),
      0
    );

    return {
      id: monitor.id,
      name: monitor.name,
      url: monitor.url,
      projectName: monitor.project.name,
      totalChecks,
      successfulChecks,
      failedChecks,
      uptimePercentage: Math.round(uptimePercentage * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime),
      minResponseTime: Math.round(minResponseTime),
      maxResponseTime: Math.round(maxResponseTime),
      incidents: incidents.length,
      totalDowntimeSeconds,
    };
  }

  /**
   * Get report schedules
   */
  async getSchedules() {
    return prisma.reportSchedule.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get report schedule by ID
   */
  async getScheduleById(id: string) {
    const schedule = await prisma.reportSchedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      throw new Error(`Report schedule ${id} not found`);
    }

    return schedule;
  }

  /**
   * Create report schedule
   */
  async createSchedule(data: {
    name: string;
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    projectIds: string[];
    recipients: string[];
    format: 'PDF' | 'EXCEL' | 'CSV';
  }) {
    // Calculate next run time based on frequency
    const nextRunAt = this.calculateNextRunTime(data.frequency);

    return prisma.reportSchedule.create({
      data: {
        ...data,
        isActive: true,
        nextRunAt,
      },
    });
  }

  /**
   * Update report schedule
   */
  async updateSchedule(id: string, data: Partial<{
    name: string;
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    projectIds: string[];
    recipients: string[];
    format: 'PDF' | 'EXCEL' | 'CSV';
    isActive: boolean;
  }>) {
    const schedule = await this.getScheduleById(id);

    // Recalculate next run time if frequency changed
    let nextRunAt = schedule.nextRunAt;
    if (data.frequency && data.frequency !== schedule.frequency) {
      nextRunAt = this.calculateNextRunTime(data.frequency);
    }

    return prisma.reportSchedule.update({
      where: { id },
      data: {
        ...data,
        nextRunAt,
      },
    });
  }

  /**
   * Delete report schedule
   */
  async deleteSchedule(id: string) {
    await this.getScheduleById(id); // Check exists
    return prisma.reportSchedule.delete({
      where: { id },
    });
  }

  /**
   * Calculate next run time based on frequency
   */
  private calculateNextRunTime(frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'): Date {
    const now = new Date();

    switch (frequency) {
      case 'DAILY':
        // Next day at 8 AM
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(8, 0, 0, 0);
        return tomorrow;

      case 'WEEKLY':
        // Next Monday at 8 AM
        const nextMonday = new Date(now);
        const daysUntilMonday = (1 + 7 - now.getDay()) % 7 || 7;
        nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
        nextMonday.setHours(8, 0, 0, 0);
        return nextMonday;

      case 'MONTHLY':
        // First day of next month at 8 AM
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
        nextMonth.setHours(8, 0, 0, 0);
        return nextMonth;

      default:
        return new Date();
    }
  }

  /**
   * Get generated reports
   */
  async getGeneratedReports(limit: number = 50) {
    return prisma.generatedReport.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get generated report by ID
   */
  async getGeneratedReportById(id: string) {
    const report = await prisma.generatedReport.findUnique({
      where: { id },
    });

    if (!report) {
      throw new Error(`Generated report ${id} not found`);
    }

    return report;
  }
}

export const reportService = new ReportService();
