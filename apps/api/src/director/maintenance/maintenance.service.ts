import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { z } from 'zod';

export const CreateMaintenanceWindowSchema = z.object({
  name: z.string().min(1),
  monitorIds: z.array(z.string()).min(1),
  startTime: z.string(), // ISO timestamp
  endTime: z.string(), // ISO timestamp
  recurring: z.boolean().default(false),
  cronPattern: z.string().optional(), // e.g., "0 2 * * 0" for every Sunday at 2 AM
});

export class MaintenanceService {
  /**
   * Get all maintenance windows
   */
  async findAll() {
    return prisma.maintenanceWindow.findMany({
      orderBy: { startTime: 'desc' },
    });
  }

  /**
   * Get maintenance window by ID
   */
  async findById(id: string) {
    const window = await prisma.maintenanceWindow.findUnique({
      where: { id },
    });

    if (!window) {
      throw new Error(`Maintenance window ${id} not found`);
    }

    return window;
  }

  /**
   * Create maintenance window
   */
  async create(data: z.infer<typeof CreateMaintenanceWindowSchema>) {
    const { name, monitorIds, startTime, endTime, recurring, cronPattern } = data;

    // Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      throw new Error('End time must be after start time');
    }

    if (recurring && !cronPattern) {
      throw new Error('Cron pattern is required for recurring maintenance windows');
    }

    return prisma.maintenanceWindow.create({
      data: {
        name,
        monitorIds,
        startTime: start,
        endTime: end,
        recurring,
        cronPattern,
        isActive: true,
      },
    });
  }

  /**
   * Update maintenance window
   */
  async update(id: string, data: Partial<z.infer<typeof CreateMaintenanceWindowSchema>>) {
    await this.findById(id); // Check exists

    const updateData: any = { ...data };

    if (data.startTime) {
      updateData.startTime = new Date(data.startTime);
    }

    if (data.endTime) {
      updateData.endTime = new Date(data.endTime);
    }

    // Validate dates if both provided
    if (updateData.startTime && updateData.endTime) {
      if (updateData.endTime <= updateData.startTime) {
        throw new Error('End time must be after start time');
      }
    }

    return prisma.maintenanceWindow.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete maintenance window
   */
  async delete(id: string) {
    await this.findById(id); // Check exists
    return prisma.maintenanceWindow.delete({
      where: { id },
    });
  }

  /**
   * Check if monitor is in maintenance window
   */
  async isMonitorInMaintenance(monitorId: string): Promise<boolean> {
    const now = new Date();

    const activeWindows = await prisma.maintenanceWindow.findMany({
      where: {
        isActive: true,
        monitorIds: {
          has: monitorId,
        },
        startTime: {
          lte: now,
        },
        endTime: {
          gte: now,
        },
      },
    });

    const result = activeWindows.length > 0;

    if (result) {
      logger.debug(`Monitor ${monitorId} is in maintenance window`);
    }

    return result;
  }

  /**
   * Get active maintenance windows for monitor
   */
  async getActiveWindowsForMonitor(monitorId: string) {
    const now = new Date();

    return prisma.maintenanceWindow.findMany({
      where: {
        isActive: true,
        monitorIds: {
          has: monitorId,
        },
        startTime: {
          lte: now,
        },
        endTime: {
          gte: now,
        },
      },
    });
  }

  /**
   * Get upcoming maintenance windows
   */
  async getUpcomingWindows(days: number = 7) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return prisma.maintenanceWindow.findMany({
      where: {
        isActive: true,
        startTime: {
          gte: now,
          lte: futureDate,
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  /**
   * Cleanup expired maintenance windows
   */
  async cleanupExpired() {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const result = await prisma.maintenanceWindow.deleteMany({
      where: {
        endTime: {
          lt: oneMonthAgo,
        },
        recurring: false,
      },
    });

    logger.info(`Cleaned up ${result.count} expired maintenance windows`);
    return result.count;
  }
}

export const maintenanceService = new MaintenanceService();
