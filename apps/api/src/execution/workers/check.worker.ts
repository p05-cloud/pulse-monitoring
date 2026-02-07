import { Worker, Job } from 'bullmq';
import { redis } from '../../config/redis';
import { prisma } from '../../config/database';
import { httpChecker } from '../checker/http.checker';
import { CheckJobData } from '../../orchestration/queues/check.queue';
import { logger } from '../../utils/logger';
import { MonitorStatus, MonitorType } from '@prisma/client';
import { incidentDetector } from '../../director/incidents/incident.detector';
import { aggregatorParser, type AggregatorConfig } from '../aggregator/aggregator.parser';

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

      // Get monitor to check if it's an aggregator
      const monitor = await prisma.monitor.findUnique({
        where: { id: monitorId },
      });

      if (!monitor) {
        throw new Error(`Monitor ${monitorId} not found`);
      }

      // Execute the HTTP check
      const result = await httpChecker.check(
        url,
        method,
        timeoutMs,
        expectedStatus,
        keyword,
        headers,
        body
      );

      // Handle based on monitor type
      if (monitor.monitorType === MonitorType.AGGREGATOR && monitor.aggregatorConfig) {
        // Process as aggregator
        return await this.processAggregatorCheck(monitor, result);
      } else {
        // Process as simple monitor
        return await this.processSimpleCheck(monitor, result);
      }
    } catch (error: any) {
      logger.error(`Error processing check for monitor ${monitorId}:`, error);
      throw error;
    }
  }

  /**
   * Process check for simple (non-aggregator) monitor
   */
  private async processSimpleCheck(monitor: any, result: any) {
    // Store check result
    await prisma.checkResult.create({
      data: {
        monitorId: monitor.id,
        checkedAt: new Date(),
        success: result.success,
        responseTimeMs: result.responseTimeMs,
        statusCode: result.statusCode,
        errorCategory: result.errorCategory,
        errorMessage: result.errorMessage,
        rcaDetails: result.rcaDetails as any,
      },
    });

    const previousStatus = monitor.currentStatus;
    const newConsecutiveFailures = result.success ? 0 : monitor.consecutiveFailures + 1;

    // Determine new status
    let newStatus: MonitorStatus;
    if (result.success) {
      newStatus = MonitorStatus.UP;
    } else {
      if (newConsecutiveFailures >= 3) {
        newStatus = MonitorStatus.DOWN;
      } else {
        newStatus = MonitorStatus.DEGRADED;
      }
    }

    // Update monitor
    await prisma.monitor.update({
      where: { id: monitor.id },
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
      `Monitor ${monitor.id}: ${result.success ? 'UP' : 'DOWN'} (${result.responseTimeMs}ms)`
    );

    return {
      success: true,
      monitorId: monitor.id,
      result,
    };
  }

  /**
   * Process check for aggregator monitor
   */
  private async processAggregatorCheck(monitor: any, result: any) {
    const config = monitor.aggregatorConfig as AggregatorConfig;

    // Parse response to extract sub-monitors
    let subMonitorResults: any[] = [];
    try {
      // Parse the response data (could be JSON object or string)
      const responseData = typeof result.rcaDetails?.phases?.http?.responseBodyPreview === 'string'
        ? JSON.parse(result.rcaDetails.phases.http.responseBodyPreview)
        : result.rcaDetails?.phases?.http?.responseBodyPreview || {};

      subMonitorResults = aggregatorParser.parseResponse(responseData, config);
    } catch (parseError) {
      logger.error(`Failed to parse aggregator response for monitor ${monitor.id}:`, parseError);
      subMonitorResults = [];
    }

    // Create check results for each sub-monitor
    const checkedAt = new Date();
    const checkPromises = subMonitorResults.map((subResult) =>
      prisma.checkResult.create({
        data: {
          monitorId: monitor.id,
          checkedAt,
          success: subResult.success,
          responseTimeMs: subResult.responseTimeMs,
          statusCode: subResult.statusCode,
          errorMessage: subResult.errorMessage,
          subMonitorName: subResult.name,
          subMonitorData: subResult.rawData as any,
        },
      })
    );

    await Promise.all(checkPromises);

    // Calculate overall status
    const overallStatus = aggregatorParser.calculateOverallStatus(subMonitorResults);
    const previousStatus = monitor.currentStatus;

    // Map to MonitorStatus enum
    let newStatus: MonitorStatus;
    if (overallStatus === 'UP') {
      newStatus = MonitorStatus.UP;
    } else if (overallStatus === 'DOWN') {
      newStatus = MonitorStatus.DOWN;
    } else {
      newStatus = MonitorStatus.DEGRADED;
    }

    // Update monitor
    await prisma.monitor.update({
      where: { id: monitor.id },
      data: {
        currentStatus: newStatus,
        lastCheckAt: checkedAt,
        consecutiveFailures: newStatus === MonitorStatus.UP ? 0 : monitor.consecutiveFailures + 1,
        lastStatusChangeAt: previousStatus !== newStatus ? checkedAt : monitor.lastStatusChangeAt,
      },
    });

    logger.info(
      `Aggregator Monitor ${monitor.id}: ${newStatus} (${subMonitorResults.length} sub-monitors)`
    );

    return {
      success: true,
      monitorId: monitor.id,
      result,
      subMonitors: subMonitorResults,
    };
  }

  async close() {
    await this.worker.close();
    logger.info('Check worker stopped');
  }
}

// Create and export worker instance
export const checkWorker = new CheckWorker();
