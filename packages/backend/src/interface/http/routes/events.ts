import type { FastifyInstance } from 'fastify';
import type { ScanEvent } from '@dast/shared';
import type { Container } from '../../composition/container';

/** Server-Sent Events stream of a scan's live progress and findings. */
export function registerEventRoutes(app: FastifyInstance, c: Container): void {
  app.get('/api/scans/:id/events', async (req, reply) => {
    const { id } = req.params as { id: string };

    reply.hijack();
    const raw = reply.raw;
    raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    raw.write('retry: 3000\n\n');

    const send = (event: ScanEvent): void => {
      raw.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    // Emit a current-state snapshot immediately so late subscribers catch up.
    try {
      const scan = await c.useCases.getScan.execute(id);
      send({ type: 'status', scanId: id, status: scan.status, progress: scan.progress });
    } catch {
      // Scan not found yet; the client will still receive future events.
    }

    const unsubscribe = await c.eventBus.subscribe(id, send);
    const heartbeat = setInterval(() => raw.write(': ping\n\n'), 15_000);

    req.raw.on('close', () => {
      clearInterval(heartbeat);
      void unsubscribe();
    });
  });
}
