import type IORedis from 'ioredis';
import { scanEventSchema, type ScanEvent } from '@dast/shared';
import type { EventPublisher, EventSubscriber, Unsubscribe } from '../../application/ports/EventBus';

const channel = (scanId: string): string => `scan:${scanId}:events`;

/**
 * Redis pub/sub event bus. The API process subscribes (for SSE) and the worker
 * process publishes; both talk to the same Redis. ioredis requires a dedicated
 * connection per subscriber, so `subFactory` mints a fresh one each subscribe.
 */
export class RedisEventBus implements EventPublisher, EventSubscriber {
  constructor(
    private readonly pub: IORedis,
    private readonly subFactory: () => IORedis,
  ) {}

  async publish(event: ScanEvent): Promise<void> {
    await this.pub.publish(channel(event.scanId), JSON.stringify(event));
  }

  async subscribe(scanId: string, handler: (event: ScanEvent) => void): Promise<Unsubscribe> {
    const sub = this.subFactory();
    const chan = channel(scanId);
    await sub.subscribe(chan);
    sub.on('message', (_channel, payload) => {
      try {
        handler(scanEventSchema.parse(JSON.parse(payload)));
      } catch {
        // Ignore malformed messages.
      }
    });
    return async () => {
      await sub.unsubscribe(chan).catch(() => undefined);
      sub.disconnect();
    };
  }
}
