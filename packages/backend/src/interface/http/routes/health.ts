import type { FastifyInstance } from 'fastify';
import type { Container } from '../../composition/container';

export function registerHealthRoutes(app: FastifyInstance, _c: Container): void {
  app.get('/health', async () => ({ status: 'ok' }));
}
