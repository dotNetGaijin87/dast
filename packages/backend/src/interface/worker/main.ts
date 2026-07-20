import { Worker } from 'bullmq';
import { buildContainer } from '../composition/container';
import { SCAN_QUEUE_NAME } from '../../infrastructure/queue/BullMqJobQueue';
import { createRedis } from '../../infrastructure/redis';

interface ScanJobData {
  scanId: string;
}

async function main(): Promise<void> {
  const container = buildContainer();
  const connection = createRedis(container.env.REDIS_URL);

  const worker = new Worker<ScanJobData>(
    SCAN_QUEUE_NAME,
    async (job) => {
      await container.runScan.execute(job.data.scanId);
    },
    { connection, concurrency: container.env.SCAN_MAX_CONCURRENCY },
  );

  worker.on('completed', (job) => container.logger.info({ jobId: job.id }, 'scan job completed'));
  worker.on('failed', (job, err) =>
    container.logger.error({ jobId: job?.id, err }, 'scan job failed'),
  );

  container.logger.info({ concurrency: container.env.SCAN_MAX_CONCURRENCY }, 'scan worker started');

  const shutdown = async (signal: string): Promise<void> => {
    container.logger.info({ signal }, 'shutting down worker');
    await worker.close();
    connection.disconnect();
    await container.shutdown();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
