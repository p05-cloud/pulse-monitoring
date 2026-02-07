import { Queue, QueueOptions } from 'bullmq';
import { redis } from '../../config/redis';
import { logger } from '../../utils/logger';

const defaultQueueOptions: QueueOptions = {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
};

export const queues = {
  check: new Queue('check-queue', defaultQueueOptions),
  notification: new Queue('notification-queue', defaultQueueOptions),
  report: new Queue('report-queue', defaultQueueOptions),
};

// Log queue events
Object.entries(queues).forEach(([name, queue]) => {
  queue.on('error', (error) => {
    logger.error(`Queue ${name} error:`, error);
  });

  queue.on('waiting', (jobId) => {
    logger.debug(`Job ${jobId} is waiting in ${name} queue`);
  });
});

logger.info('✅ Queues configured successfully');

export default queues;
