import { z } from 'zod';
import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { HttpMethod, MonitorStatus } from '@prisma/client';

// Validation schemas
export const CreateMonitorSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Invalid URL'),
  method: z.nativeEnum(HttpMethod).optional(),
  intervalSeconds: z.number().min(60).max(3600).optional(),
  timeoutMs: z.number().min(5000).max(60000).optional(),
  expectedStatus: z.number().min(100).max(599).optional(),
  keyword: z.string().optional(),
  headers: z.record(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  alertContactIds: z.array(z.string().uuid()).optional(),
});

export const UpdateMonitorSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  method: z.nativeEnum(HttpMethod).optional(),
  intervalSeconds: z.number().min(60).max(3600).optional(),
  timeoutMs: z.number().min(5000).max(60000).optional(),
  expectedStatus: z.number().min(100).max(599).optional(),
  keyword: z.string().optional(),
  headers: z.record(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  alertContactIds: z.array(z.string().uuid()).optional(),
});

interface MonitorFilters {
  projectId?: string;
  status?: MonitorStatus;
  tags?: string[];
}

export class MonitorService {
  /**
   * Get all monitors with filtering and pagination
   */
  async findAll(filters: MonitorFilters, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters.status) {
      where.currentStatus = filters.status;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasEvery: filters.tags,
      };
    }

    const [monitors, total] = await Promise.all([
      prisma.monitor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          alertContacts: {
            include: {
              alertContact: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
        },
      }),
      prisma.monitor.count({ where }),
    ]);

    return { monitors, total };
  }

  /**
   * Get monitor by ID
   */
  async findById(id: string) {
    const monitor = await prisma.monitor.findUnique({
      where: { id },
      include: {
        project: true,
        alertContacts: {
          include: {
            alertContact: true,
          },
        },
      },
    });

    if (!monitor) {
      throw new NotFoundError('Monitor', id);
    }

    return monitor;
  }

  /**
   * Create new monitor
   */
  async create(data: z.infer<typeof CreateMonitorSchema>) {
    const { alertContactIds, ...monitorData } = data;

    const monitor = await prisma.monitor.create({
      data: {
        ...monitorData,
        headers: monitorData.headers || {},
        tags: monitorData.tags || [],
        alertContacts: alertContactIds
          ? {
              create: alertContactIds.map((contactId) => ({
                alertContactId: contactId,
              })),
            }
          : undefined,
      },
      include: {
        project: true,
        alertContacts: {
          include: {
            alertContact: true,
          },
        },
      },
    });

    return monitor;
  }

  /**
   * Update monitor
   */
  async update(id: string, data: z.infer<typeof UpdateMonitorSchema>) {
    // Check if monitor exists
    await this.findById(id);

    const { alertContactIds, ...monitorData } = data;

    // If alertContactIds provided, update associations
    if (alertContactIds !== undefined) {
      // Delete existing associations
      await prisma.monitorAlertContact.deleteMany({
        where: { monitorId: id },
      });

      // Create new associations
      if (alertContactIds.length > 0) {
        await prisma.monitorAlertContact.createMany({
          data: alertContactIds.map((contactId) => ({
            monitorId: id,
            alertContactId: contactId,
          })),
        });
      }
    }

    const monitor = await prisma.monitor.update({
      where: { id },
      data: monitorData,
      include: {
        project: true,
        alertContacts: {
          include: {
            alertContact: true,
          },
        },
      },
    });

    return monitor;
  }

  /**
   * Delete monitor
   */
  async delete(id: string) {
    // Check if monitor exists
    await this.findById(id);

    // Delete monitor (cascade deletes checks, incidents, etc.)
    await prisma.monitor.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Pause monitor
   */
  async pause(id: string) {
    await this.findById(id);

    const monitor = await prisma.monitor.update({
      where: { id },
      data: {
        isActive: false,
        currentStatus: MonitorStatus.PAUSED,
      },
    });

    return monitor;
  }

  /**
   * Resume monitor
   */
  async resume(id: string) {
    await this.findById(id);

    const monitor = await prisma.monitor.update({
      where: { id },
      data: {
        isActive: true,
        currentStatus: MonitorStatus.UNKNOWN,
      },
    });

    return monitor;
  }

  /**
   * Get check history
   */
  async getChecks(monitorId: string, limit: number = 50) {
    await this.findById(monitorId);

    const checks = await prisma.checkResult.findMany({
      where: { monitorId },
      orderBy: { checkedAt: 'desc' },
      take: limit,
    });

    return checks;
  }

  /**
   * Get incident history
   */
  async getIncidents(monitorId: string) {
    await this.findById(monitorId);

    const incidents = await prisma.incident.findMany({
      where: { monitorId },
      orderBy: { startedAt: 'desc' },
    });

    return incidents;
  }
}

export const monitorService = new MonitorService();
