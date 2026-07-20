import type { FastifyInstance } from 'fastify';
import { importSpecSchema } from '@dast/shared';
import type { Container } from '../../composition/container';

export function registerSpecRoutes(app: FastifyInstance, c: Container): void {
  app.post('/api/targets/:id/specs', async (req, reply) => {
    const { id } = req.params as { id: string };
    const input = importSpecSchema.parse(req.body);
    const result = await c.useCases.importSpec.execute(id, input);
    return reply.code(201).send(result);
  });
}
