import { PrismaClient, MonitorStatus, IncidentStatus } from '@prisma/client';
import { prisma } from '../config/database';

export class DashboardService {
  constructor(private prisma: PrismaClient) {}

  async getSummary() {
    // Get all monitors count
    const totalMonitors = await this.prisma.monitor.count();

    // Get monitors by status
    const upMonitors = await this.prisma.monitor.count({
      where: { currentStatus: MonitorStatus.UP },
    });

    const downMonitors = await this.prisma.monitor.count({
      where: { currentStatus: MonitorStatus.DOWN },
    });

    const degradedMonitors = await this.prisma.monitor.count({
      where: { currentStatus: MonitorStatus.DEGRADED },
    });

    const pausedMonitors = await this.prisma.monitor.count({
      where: { currentStatus: MonitorStatus.PAUSED },
    });

    // Get open incidents
    const openIncidents = await this.prisma.incident.count({
      where: {
        status: {
          in: [IncidentStatus.OPEN, IncidentStatus.ACKNOWLEDGED],
        },
      },
    });

    // Calculate average response time (last 100 successful checks)
    const recentChecks = await this.prisma.checkResult.findMany({
      where: {
        success: true,
        responseTimeMs: { not: null },
      },
      select: { responseTimeMs: true },
      orderBy: { checkedAt: 'desc' },
      take: 100,
    });

    const avgResponseTime = recentChecks.length > 0
      ? Math.round(
          recentChecks.reduce((sum, check) => sum + (check.responseTimeMs || 0), 0) /
            recentChecks.length
        )
      : 0;

    // Calculate uptime percentage (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const totalChecks = await this.prisma.checkResult.count({
      where: { checkedAt: { gte: oneDayAgo } },
    });
    const successfulChecks = await this.prisma.checkResult.count({
      where: {
        checkedAt: { gte: oneDayAgo },
        success: true,
      },
    });

    const uptimePercentage = totalChecks > 0
      ? (successfulChecks / totalChecks) * 100
      : 100;

    return {
      totalMonitors,
      upMonitors,
      downMonitors,
      degradedMonitors,
      pausedMonitors,
      openIncidents,
      avgResponseTime,
      uptimePercentage,
    };
  }

  async getProjectsHealth() {
    const projects = await this.prisma.project.findMany({
      include: {
        monitors: {
          include: {
            checkResults: {
              orderBy: { checkedAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    return projects.map((project) => {
      const monitors = project.monitors;
      const totalMonitors = monitors.length;
      const upMonitors = monitors.filter(m => m.currentStatus === MonitorStatus.UP).length;
      const downMonitors = monitors.filter(m => m.currentStatus === MonitorStatus.DOWN).length;
      const degradedMonitors = monitors.filter(m => m.currentStatus === MonitorStatus.DEGRADED).length;

      // Calculate average response time for this project
      const responseTimes = monitors
        .flatMap(m => m.checkResults)
        .map(c => c.responseTimeMs)
        .filter((t): t is number => t !== null);

      const avgResponseTime = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length)
        : 0;

      // Calculate uptime percentage
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const monitorIds = monitors.map(m => m.id);

      return this.prisma.checkResult.count({
        where: {
          monitorId: { in: monitorIds },
          checkedAt: { gte: oneDayAgo },
        },
      }).then(totalChecks => {
        return this.prisma.checkResult.count({
          where: {
            monitorId: { in: monitorIds },
            checkedAt: { gte: oneDayAgo },
            success: true,
          },
        }).then(successfulChecks => {
          const uptimePercentage = totalChecks > 0
            ? (successfulChecks / totalChecks) * 100
            : 100;

          return this.prisma.incident.count({
            where: {
              monitorId: { in: monitorIds },
              status: {
                in: [IncidentStatus.OPEN, IncidentStatus.ACKNOWLEDGED],
              },
            },
          }).then(openIncidents => ({
            projectId: project.id,
            projectName: project.name,
            totalMonitors,
            upMonitors,
            downMonitors,
            degradedMonitors,
            uptimePercentage,
            avgResponseTime,
            openIncidents,
          }));
        });
      });
    }).reduce(async (acc, promise) => {
      const results = await acc;
      const result = await promise;
      return [...results, result];
    }, Promise.resolve([] as any[]));
  }

  async getActivity(limit: number = 10) {
    const activities = await this.prisma.activityLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return activities;
  }
}

export const dashboardService = new DashboardService(prisma);
