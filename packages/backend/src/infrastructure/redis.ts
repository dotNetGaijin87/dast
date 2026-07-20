import IORedis from 'ioredis';

/**
 * Create an ioredis connection. `maxRetriesPerRequest: null` is required by
 * BullMQ workers (blocking commands) and harmless elsewhere.
 */
export function createRedis(url: string): IORedis {
  return new IORedis(url, { maxRetriesPerRequest: null });
}
