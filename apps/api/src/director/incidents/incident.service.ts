import { z } from 'zod';
import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { IncidentStatus } from '@prisma/client';
import { calculateDuration } from '@pulse/shared';

export const UpdateIncidentSchema = z.object({
  notes: z.string().optional(),
});

export class IncidentService {
  /**
   * Get all incidents with filtering
   */
  async findAll(filters: { monitorId?: string; status?: IncidentStatus }, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters.monitorId) {
      where.monitorId = filters.monitorId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: {
          monitor: {
            include: {
              project: true,
            },
          },
        },
      }),
      prisma.incident.count({ where }),
    ]);

    return { incidents, total };
  }

  /**
   * Get incident by ID
   */
  async findById(id: string) {
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        monitor: {
          include: {
            project: true,
            alertContacts: {
              include: {
                alertContact: true,
              },
            },
          },
        },
        notificationLogs: {
          include: {
            alertContact: true,
          },
        },
      },
    });

    if (!incident) {
      throw new NotFoundError('Incident', id);
    }

    return incident;
  }

  /**
   * Acknowledge incident
   */
  async acknowledge(id: string, userId: string) {
    const incident = await this.findById(id);

    if (incident.status !== IncidentStatus.OPEN) {
      throw new Error('Only OPEN incidents can be acknowledged');
    }

    const updated = await prisma.incident.update({
      where: { id },
      data: {
        status: IncidentStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
        acknowledgedBy: userId,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'INCIDENT_ACKNOWLEDGED',
        entityType: 'Incident',
        entityId: id,
      },
    });

    return updated;
  }

  /**
   * Manually resolve incident
   */
  async resolve(id: string, userId: string) {
    const incident = await this.findById(id);

    if (incident.status === IncidentStatus.RESOLVED) {
      throw new Error('Incident is already resolved');
    }

    const resolvedAt = new Date();
    const durationSeconds = calculateDuration(incident.startedAt, resolvedAt);

    const updated = await prisma.incident.update({
      where: { id },
      data: {
        status: IncidentStatus.RESOLVED,
        resolvedAt,
        durationSeconds,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'INCIDENT_MANUALLY_RESOLVED',
        entityType: 'Incident',
        entityId: id,
      },
    });

    return updated;
  }

  /**
   * Update incident notes
   */
  async updateNotes(id: string, notes: string) {
    await this.findById(id);

    const updated = await prisma.incident.update({
      where: { id },
      data: { notes },
    });

    return updated;
  }
}

export const incidentService = new IncidentService();
