import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { Monitor, MonitorStatus, IncidentStatus } from '@prisma/client';
import { CheckResult } from '../../execution/checker/http.checker';
import { calculateDuration } from '@pulse/shared';
import { notificationQueue } from '../../orchestration/queues/notification.queue';
import { maintenanceService } from '../maintenance/maintenance.service';

export class IncidentDetector {
  /**
   * Process check result and manage incidents
   */
  async processCheckResult(
    monitor: Monitor,
    checkResult: CheckResult,
    newStatus: MonitorStatus,
    previousStatus: MonitorStatus
  ) {
    // Check if monitor just went DOWN (3 consecutive failures)
    if (newStatus === MonitorStatus.DOWN && previousStatus !== MonitorStatus.DOWN) {
      await this.createIncident(monitor, checkResult);
    }

    // Check if monitor just recovered
    if (newStatus === MonitorStatus.UP && previousStatus === MonitorStatus.DOWN) {
      await this.resolveIncident(monitor);
    }
  }

  /**
   * Create a new incident when monitor goes DOWN
   */
  private async createIncident(monitor: Monitor, checkResult: CheckResult) {
    try {
      // Check if there's already an open incident
      const existingIncident = await prisma.incident.findFirst({
        where: {
          monitorId: monitor.id,
          status: {
            in: [IncidentStatus.OPEN, IncidentStatus.ACKNOWLEDGED],
          },
        },
      });

      if (existingIncident) {
        logger.debug(`Incident already exists for monitor ${monitor.id}`);
        return existingIncident;
      }

      // Create new incident
      const incident = await prisma.incident.create({
        data: {
          monitorId: monitor.id,
          status: IncidentStatus.OPEN,
          startedAt: new Date(),
          errorCategory: checkResult.errorCategory,
          errorMessage: checkResult.errorMessage,
          rcaDetails: checkResult.rcaDetails as any,
        },
      });

      logger.warn(
        `🚨 INCIDENT CREATED: Monitor "${monitor.name}" is DOWN (${checkResult.errorCategory})`
      );

      // Log activity
      await prisma.activityLog.create({
        data: {
          action: 'INCIDENT_CREATED',
          entityType: 'Incident',
          entityId: incident.id,
          details: {
            monitorId: monitor.id,
            monitorName: monitor.name,
            errorCategory: checkResult.errorCategory,
            errorMessage: checkResult.errorMessage,
          },
        },
      });

      // Trigger DOWN notifications
      await this.sendNotifications(incident.id, monitor, 'DOWN', checkResult.rcaDetails);

      return incident;
    } catch (error) {
      logger.error(`Error creating incident for monitor ${monitor.id}:`, error);
      throw error;
    }
  }

  /**
   * Resolve incident when monitor recovers
   */
  private async resolveIncident(monitor: Monitor) {
    try {
      // Find open incident
      const incident = await prisma.incident.findFirst({
        where: {
          monitorId: monitor.id,
          status: {
            in: [IncidentStatus.OPEN, IncidentStatus.ACKNOWLEDGED],
          },
        },
        orderBy: {
          startedAt: 'desc',
        },
      });

      if (!incident) {
        logger.debug(`No open incident found for monitor ${monitor.id}`);
        return;
      }

      // Calculate duration
      const resolvedAt = new Date();
      const durationSeconds = calculateDuration(incident.startedAt, resolvedAt);

      // Resolve incident
      const resolvedIncident = await prisma.incident.update({
        where: { id: incident.id },
        data: {
          status: IncidentStatus.RESOLVED,
          resolvedAt,
          durationSeconds,
        },
      });

      logger.info(
        `✅ INCIDENT RESOLVED: Monitor "${monitor.name}" is UP again (Duration: ${durationSeconds}s)`
      );

      // Log activity
      await prisma.activityLog.create({
        data: {
          action: 'INCIDENT_RESOLVED',
          entityType: 'Incident',
          entityId: incident.id,
          details: {
            monitorId: monitor.id,
            monitorName: monitor.name,
            durationSeconds,
          },
        },
      });

      // Trigger UP notifications
      await this.sendNotifications(incident.id, monitor, 'UP', null, durationSeconds);

      return resolvedIncident;
    } catch (error) {
      logger.error(`Error resolving incident for monitor ${monitor.id}:`, error);
      throw error;
    }
  }

  /**
   * Send notifications for incident
   */
  private async sendNotifications(
    incidentId: string,
    monitor: Monitor,
    type: 'DOWN' | 'UP' | 'DEGRADED',
    rcaDetails?: any,
    duration?: number
  ) {
    try {
      // Check if monitor is in maintenance window
      const isInMaintenance = await maintenanceService.isMonitorInMaintenance(monitor.id);
      if (isInMaintenance) {
        logger.info(`Monitor ${monitor.id} is in maintenance window, skipping ${type} notifications`);
        return;
      }
      // Get monitor with alert contacts and project
      const monitorWithContacts = await prisma.monitor.findUnique({
        where: { id: monitor.id },
        include: {
          project: true,
          alertContacts: {
            include: {
              alertContact: true,
            },
          },
        },
      });

      if (!monitorWithContacts || monitorWithContacts.alertContacts.length === 0) {
        logger.debug(`No alert contacts configured for monitor ${monitor.id}`);
        return;
      }

      // Extract error details from RCA for DOWN notifications
      let errorMessage: string | undefined;
      let errorCategory: string | undefined;

      if (type === 'DOWN' && rcaDetails) {
        errorCategory = rcaDetails.category;
        errorMessage = rcaDetails.message;
      }

      // Queue notifications for each alert contact
      const notificationJobs = monitorWithContacts.alertContacts.map((mc) => ({
        incidentId,
        alertContactId: mc.alertContact.id,
        type,
        monitorName: monitor.name,
        monitorUrl: monitor.url,
        projectName: monitorWithContacts.project?.name,
        errorMessage,
        errorCategory,
        timestamp: new Date().toISOString(),
        duration,
        rcaDetails,
      }));

      await notificationQueue.addBulkNotificationJobs(notificationJobs);

      logger.info(
        `Queued ${notificationJobs.length} ${type} notifications for monitor ${monitor.id}`
      );
    } catch (error) {
      logger.error(`Failed to queue notifications for monitor ${monitor.id}:`, error);
      // Don't throw - notification failures shouldn't block incident management
    }
  }

  /**
   * Get active incidents count
   */
  async getActiveIncidentsCount(): Promise<number> {
    return prisma.incident.count({
      where: {
        status: {
          in: [IncidentStatus.OPEN, IncidentStatus.ACKNOWLEDGED],
        },
      },
    });
  }

  /**
   * Get all active incidents
   */
  async getActiveIncidents() {
    return prisma.incident.findMany({
      where: {
        status: {
          in: [IncidentStatus.OPEN, IncidentStatus.ACKNOWLEDGED],
        },
      },
      include: {
        monitor: {
          include: {
            project: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });
  }
}

export const incidentDetector = new IncidentDetector();
