import { prisma } from '../config/database';

interface CreateMaintenanceInput {
  name: string;
  description?: string;
  monitorIds: string[];
  startTime: Date;
  endTime: Date;
  timezone?: string;
  recurring?: boolean;
  cronPattern?: string;
  notifyBefore?: number;
}

interface UpdateMaintenanceInput extends Partial<CreateMaintenanceInput> {
  isActive?: boolean;
}

export class MaintenanceService {
  // Get all maintenance windows
  async getAll() {
    return prisma.maintenanceWindow.findMany({
      orderBy: { startTime: 'desc' },
    });
  }

  // Get upcoming maintenance windows
  async getUpcoming() {
    return prisma.maintenanceWindow.findMany({
      where: {
        isActive: true,
        endTime: { gt: new Date() },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  // Get active maintenance windows (currently in progress)
  async getActive() {
    const now = new Date();
    return prisma.maintenanceWindow.findMany({
      where: {
        isActive: true,
        startTime: { lte: now },
        endTime: { gt: now },
      },
    });
  }

  // Check if a monitor is currently in maintenance
  async isMonitorInMaintenance(monitorId: string): Promise<boolean> {
    const now = new Date();
    const activeWindow = await prisma.maintenanceWindow.findFirst({
      where: {
        isActive: true,
        monitorIds: { has: monitorId },
        startTime: { lte: now },
        endTime: { gt: now },
      },
    });
    return !!activeWindow;
  }

  // Get by ID
  async getById(id: string) {
    return prisma.maintenanceWindow.findUnique({
      where: { id },
    });
  }

  // Create maintenance window
  async create(data: CreateMaintenanceInput) {
    return prisma.maintenanceWindow.create({
      data: {
        name: data.name,
        description: data.description,
        monitorIds: data.monitorIds,
        startTime: data.startTime,
        endTime: data.endTime,
        timezone: data.timezone || 'UTC',
        recurring: data.recurring || false,
        cronPattern: data.cronPattern,
        notifyBefore: data.notifyBefore || 30,
        isActive: true,
      },
    });
  }

  // Update maintenance window
  async update(id: string, data: UpdateMaintenanceInput) {
    return prisma.maintenanceWindow.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.monitorIds !== undefined && { monitorIds: data.monitorIds }),
        ...(data.startTime !== undefined && { startTime: data.startTime }),
        ...(data.endTime !== undefined && { endTime: data.endTime }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
        ...(data.recurring !== undefined && { recurring: data.recurring }),
        ...(data.cronPattern !== undefined && { cronPattern: data.cronPattern }),
        ...(data.notifyBefore !== undefined && { notifyBefore: data.notifyBefore }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  // Delete maintenance window
  async delete(id: string) {
    return prisma.maintenanceWindow.delete({
      where: { id },
    });
  }

  // Toggle active status
  async toggleActive(id: string, isActive: boolean) {
    return prisma.maintenanceWindow.update({
      where: { id },
      data: { isActive },
    });
  }
}

export const maintenanceService = new MaintenanceService();
