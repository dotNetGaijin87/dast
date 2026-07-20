import type { ScanEvent } from '@dast/shared';

export interface EventPublisher {
  publish(event: ScanEvent): Promise<void>;
}

export type Unsubscribe = () => Promise<void>;

export interface EventSubscriber {
  /** Subscribe to a scan's event stream. Resolves with an unsubscribe function. */
  subscribe(scanId: string, handler: (event: ScanEvent) => void): Promise<Unsubscribe>;
}
