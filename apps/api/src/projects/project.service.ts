import { z } from 'zod';
import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';
import { MonitorStatus } from '@prisma/client';

// Validation schemas
export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
});

export const UpdateProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
});

export class ProjectService {
  /**
   * Get all projects
   */
  async findAll() {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { monitors: true },
        },
      },
    });

    return projects;
  }

  /**
   * Get project by ID
   */
  async findById(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        monitors: {
          select: {
            id: true,
            name: true,
            url: true,
            currentStatus: true,
            isActive: true,
          },
        },
        _count: {
          select: { monitors: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project', id);
    }

    return project;
  }

  /**
   * Create new project
   */
  async create(data: z.infer<typeof CreateProjectSchema>) {
    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color,
      },
    });

    return project;
  }

  /**
   * Update project
   */
  async update(id: string, data: z.infer<typeof UpdateProjectSchema>) {
    // Check if project exists
    await this.findById(id);

    const project = await prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        color: data.color,
      },
    });

    return project;
  }

  /**
   * Delete project
   */
  async delete(id: string) {
    // Check if project exists
    await this.findById(id);

    // Delete project (cascade deletes monitors and related data)
    await prisma.project.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Get project health summary
   */
  async getHealth(id: string) {
    // Check if project exists
    await this.findById(id);

    // Get monitor counts by status
    const monitors = await prisma.monitor.findMany({
      where: { projectId: id },
      select: {
        currentStatus: true,
        isActive: true,
      },
    });

    const totalMonitors = monitors.length;
    const activeMonitors = monitors.filter((m) => m.isActive).length;
    const upMonitors = monitors.filter((m) => m.currentStatus === MonitorStatus.UP).length;
    const downMonitors = monitors.filter((m) => m.currentStatus === MonitorStatus.DOWN).length;
    const degradedMonitors = monitors.filter(
      (m) => m.currentStatus === MonitorStatus.DEGRADED
    ).length;
    const pausedMonitors = monitors.filter((m) => !m.isActive).length;

    // Calculate uptime percentage (only for active monitors)
    const uptimePercentage =
      activeMonitors > 0 ? ((upMonitors / activeMonitors) * 100).toFixed(2) : '0.00';

    // Get recent incidents
    const recentIncidents = await prisma.incident.count({
      where: {
        monitor: {
          projectId: id,
        },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    return {
      projectId: id,
      totalMonitors,
      activeMonitors,
      monitors: {
        up: upMonitors,
        down: downMonitors,
        degraded: degradedMonitors,
        paused: pausedMonitors,
      },
      uptimePercentage: parseFloat(uptimePercentage),
      recentIncidents,
    };
  }
}

export const projectService = new ProjectService();
