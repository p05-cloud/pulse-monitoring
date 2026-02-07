import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { HttpMethod, MonitorStatus } from '@prisma/client';

interface MonitorCsvRow {
  name: string;
  url: string;
  method: string;
  intervalSeconds: number;
  timeoutMs: number;
  expectedStatus: number;
  projectName: string;
  tags: string;
}

export class MonitorBulkService {
  /**
   * Export monitors to CSV format
   */
  async exportToCsv(projectId?: string): Promise<string> {
    logger.info('Exporting monitors to CSV');

    const where = projectId ? { projectId } : {};

    const monitors = await prisma.monitor.findMany({
      where,
      include: {
        project: true,
      },
      orderBy: { name: 'asc' },
    });

    // CSV header
    const lines: string[] = [
      'Name,URL,Method,Interval (seconds),Timeout (ms),Expected Status,Project,Tags,Active',
    ];

    // CSV rows
    for (const monitor of monitors) {
      const tags = monitor.tags.join(';');
      lines.push(
        `"${monitor.name}","${monitor.url}",${monitor.method},${monitor.intervalSeconds},${monitor.timeoutMs},${monitor.expectedStatus},"${monitor.project.name}","${tags}",${monitor.isActive}`
      );
    }

    logger.info(`Exported ${monitors.length} monitors to CSV`);
    return lines.join('\n');
  }

  /**
   * Import monitors from CSV format
   */
  async importFromCsv(csvContent: string, projectId?: string): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    logger.info('Importing monitors from CSV');

    const lines = csvContent.split('\n').filter((line) => line.trim());

    if (lines.length < 2) {
      throw new Error('CSV file must contain at least a header and one data row');
    }

    // Skip header
    const dataLines = lines.slice(1);

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      const lineNum = i + 2; // +2 because 1-indexed and skipping header

      try {
        const row = this.parseCsvLine(dataLines[i]);

        if (!row.name || !row.url) {
          throw new Error('Name and URL are required');
        }

        // Find or create project
        let project;
        if (projectId) {
          project = await prisma.project.findUnique({
            where: { id: projectId },
          });
        } else if (row.projectName) {
          project = await prisma.project.findFirst({
            where: { name: row.projectName },
          });

          if (!project) {
            // Create project if it doesn't exist
            project = await prisma.project.create({
              data: {
                name: row.projectName,
                color: '#3B82F6',
              },
            });
          }
        }

        if (!project) {
          throw new Error('Project not found or specified');
        }

        // Parse tags
        const tags = row.tags ? row.tags.split(';').filter((t) => t.trim()) : [];

        // Validate method
        const method = (row.method || 'GET').toUpperCase();
        if (!Object.values(HttpMethod).includes(method as HttpMethod)) {
          throw new Error(`Invalid HTTP method: ${method}`);
        }

        // Create monitor
        await prisma.monitor.create({
          data: {
            projectId: project.id,
            name: row.name,
            url: row.url,
            method: method as HttpMethod,
            intervalSeconds: row.intervalSeconds || 60,
            timeoutMs: row.timeoutMs || 30000,
            expectedStatus: row.expectedStatus || 200,
            tags,
            isActive: true,
            currentStatus: MonitorStatus.UNKNOWN,
          },
        });

        success++;
        logger.debug(`Imported monitor: ${row.name}`);
      } catch (error: any) {
        failed++;
        const errorMsg = `Line ${lineNum}: ${error.message}`;
        errors.push(errorMsg);
        logger.error(errorMsg);
      }
    }

    logger.info(`CSV import completed: ${success} succeeded, ${failed} failed`);

    return { success, failed, errors };
  }

  /**
   * Parse a CSV line into a monitor row object
   */
  private parseCsvLine(line: string): MonitorCsvRow {
    // Simple CSV parser (handles quoted fields)
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // Add last field
    fields.push(current.trim());

    return {
      name: fields[0] || '',
      url: fields[1] || '',
      method: fields[2] || 'GET',
      intervalSeconds: parseInt(fields[3] || '60'),
      timeoutMs: parseInt(fields[4] || '30000'),
      expectedStatus: parseInt(fields[5] || '200'),
      projectName: fields[6] || '',
      tags: fields[7] || '',
    };
  }

  /**
   * Bulk update monitor status (pause/resume multiple monitors)
   */
  async bulkUpdateStatus(monitorIds: string[], isActive: boolean) {
    logger.info(`Bulk updating status for ${monitorIds.length} monitors: ${isActive ? 'resume' : 'pause'}`);

    const result = await prisma.monitor.updateMany({
      where: {
        id: {
          in: monitorIds,
        },
      },
      data: {
        isActive,
      },
    });

    logger.info(`Updated ${result.count} monitors`);
    return result.count;
  }

  /**
   * Bulk delete monitors
   */
  async bulkDelete(monitorIds: string[]) {
    logger.info(`Bulk deleting ${monitorIds.length} monitors`);

    const result = await prisma.monitor.deleteMany({
      where: {
        id: {
          in: monitorIds,
        },
      },
    });

    logger.info(`Deleted ${result.count} monitors`);
    return result.count;
  }

  /**
   * Bulk update tags
   */
  async bulkUpdateTags(monitorIds: string[], tagsToAdd: string[], tagsToRemove: string[]) {
    logger.info(`Bulk updating tags for ${monitorIds.length} monitors`);

    let updated = 0;

    for (const monitorId of monitorIds) {
      try {
        const monitor = await prisma.monitor.findUnique({
          where: { id: monitorId },
          select: { tags: true },
        });

        if (!monitor) continue;

        let tags = [...monitor.tags];

        // Remove tags
        tags = tags.filter((tag) => !tagsToRemove.includes(tag));

        // Add new tags (avoid duplicates)
        for (const tag of tagsToAdd) {
          if (!tags.includes(tag)) {
            tags.push(tag);
          }
        }

        await prisma.monitor.update({
          where: { id: monitorId },
          data: { tags },
        });

        updated++;
      } catch (error) {
        logger.error(`Failed to update tags for monitor ${monitorId}:`, error);
      }
    }

    logger.info(`Updated tags for ${updated} monitors`);
    return updated;
  }
}

export const monitorBulkService = new MonitorBulkService();
