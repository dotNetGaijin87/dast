import { Queue } from 'bullmq';
import type IORedis from 'ioredis';
import type { JobQueue, ScanJob } from '../../application/ports/JobQueue';

export const SCAN_QUEUE_NAME = 'scans';

export class BullMqJobQueue implements JobQueue {
  private readonly queue: Queue;

  constructor(connection: IORedis) {
    this.queue = new Queue(SCAN_QUEUE_NAME, { connection });
  }

  async enqueueScan(job: ScanJob): Promise<void> {
    await this.queue.add('scan', job, {
      attempts: 1,
      removeOnComplete: 200,
      removeOnFail: 200,
    });
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}
