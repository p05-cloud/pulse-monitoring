import { Worker, Job } from 'bullmq';
import { redis } from '../../config/redis';
import { prisma } from '../../config/database';
import { httpChecker } from '../checker/http.checker';
import { CheckJobData } from '../../orchestration/queues/check.queue';
import { logger } from '../../utils/logger';
import { MonitorStatus } from '@prisma/client';
import { incidentDetector } from '../../director/incidents/incident.detector';

export class CheckWorker {
  private worker: Worker;

  constructor() {
    this.worker = new Worker(
      'check-queue',
      async (job: Job<CheckJobData>) => {
        return await this.processCheck(job);
      },
      {
        connection: redis,
        concurrency: 10, // Process up to 10 checks concurrently
        limiter: {
          max: 100, // Max 100 jobs
          duration: 1000, // per second
        },
      }
    );

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.worker.on('completed', (job) => {
      logger.info(`Check completed for monitor ${job.data.monitorId}`);
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`Check failed for monitor ${job?.data.monitorId}:`, err);
    });

    this.worker.on('error', (err) => {
      logger.error('Check worker error:', err);
    });

    logger.info('✅ Check worker started');
  }

  private async processCheck(job: Job<CheckJobData>) {
    const { monitorId, url, method, timeoutMs, expectedStatus, keyword, headers, body } = job.data;

    try {
      logger.debug(`Processing check for monitor ${monitorId}: ${url}`);

      // Execute the check
      const result = await httpChecker.check(
        url,
        method,
        timeoutMs,
        expectedStatus,
        keyword,
        headers,
        body
      );

      // Store check result
      await prisma.checkResult.create({
        data: {
          monitorId,
          checkedAt: new Date(),
          success: result.success,
          responseTimeMs: result.responseTimeMs,
          statusCode: result.statusCode,
          errorCategory: result.errorCategory,
          errorMessage: result.errorMessage,
          rcaDetails: result.rcaDetails as any,
        },
      });

      // Update monitor status
      const monitor = await prisma.monitor.findUnique({
        where: { id: monitorId },
      });

      if (!monitor) {
        throw new Error(`Monitor ${monitorId} not found`);
      }

      const previousStatus = monitor.currentStatus;
      const newConsecutiveFailures = result.success ? 0 : monitor.consecutiveFailures + 1;

      // Determine new status
      let newStatus: MonitorStatus;
      if (result.success) {
        newStatus = MonitorStatus.UP;
      } else {
        // If we have 3 consecutive failures, mark as DOWN
        if (newConsecutiveFailures >= 3) {
          newStatus = MonitorStatus.DOWN;
        } else {
          // First or second failure - mark as DEGRADED
          newStatus = MonitorStatus.DEGRADED;
        }
      }

      // Update monitor
      await prisma.monitor.update({
        where: { id: monitorId },
        data: {
          currentStatus: newStatus,
          lastCheckAt: new Date(),
          consecutiveFailures: newConsecutiveFailures,
          lastStatusChangeAt: previousStatus !== newStatus ? new Date() : monitor.lastStatusChangeAt,
        },
      });

      // Check for incident creation/resolution
      await incidentDetector.processCheckResult(monitor, result, newStatus, previousStatus);

      logger.info(
        `Monitor ${monitorId}: ${result.success ? 'UP' : 'DOWN'} (${result.responseTimeMs}ms)`
      );

      return {
        success: true,
        monitorId,
        result,
      };
    } catch (error: any) {
      logger.error(`Error processing check for monitor ${monitorId}:`, error);
      throw error;
    }
  }

  async close() {
    await this.worker.close();
    logger.info('Check worker stopped');
  }
}

// Create and export worker instance
export const checkWorker = new CheckWorker();
