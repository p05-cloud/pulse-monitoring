import app from './app';
import config from './config';
import { logger } from './utils/logger';
import { prisma } from './config/database';
import { redis } from './config/redis';
import { checkScheduler } from './orchestration/scheduler/check.scheduler';
import { reportScheduler } from './orchestration/scheduler/report.scheduler';
import { checkWorker } from './execution/workers/check.worker';
import { notificationWorker } from './execution/workers/notification.worker';
import { reportWorker } from './execution/workers/report.worker';
import { cleanupWorker } from './execution/workers/cleanup.worker';

const PORT = config.port;

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    // Test Redis connection
    await redis.ping();
    logger.info('✅ Redis connected successfully');

    // Start schedulers
    checkScheduler.start(); // Dispatches checks every minute
    reportScheduler.start(); // Processes scheduled reports hourly
    cleanupWorker.start(); // Cleans up old data daily at 2 AM

    // Workers are auto-started on import
    logger.info('✅ All workers running');
    logger.info('  - Check Worker: Processing check queue');
    logger.info('  - Notification Worker: Processing notification queue');
    logger.info('  - Report Worker: Processing report queue');
    logger.info('  - Cleanup Worker: Scheduled for daily cleanup');

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`🚀 Pulse API server running on port ${PORT}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`\n📊 Full system active:`);
      logger.info(`  - ✓ Check Scheduler: Every minute`);
      logger.info(`  - ✓ Report Scheduler: Hourly`);
      logger.info(`  - ✓ Cleanup Worker: Daily at 2 AM`);
      logger.info(`  - ✓ Incident Detection: 3-failure rule`);
      logger.info(`  - ✓ Notifications: Email, Teams, Webhook`);
      logger.info(`  - ✓ Reports: PDF, Excel, CSV`);
      logger.info(`  - ✓ Maintenance Windows: Active`);
      logger.info(`  - ✓ Data Retention: 7-day check history`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  checkScheduler.stop();
  reportScheduler.stop();
  cleanupWorker.stop();
  await checkWorker.close();
  await notificationWorker.shutdown();
  await reportWorker.shutdown();
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  checkScheduler.stop();
  reportScheduler.stop();
  cleanupWorker.stop();
  await checkWorker.close();
  await notificationWorker.shutdown();
  await reportWorker.shutdown();
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
});

startServer();
