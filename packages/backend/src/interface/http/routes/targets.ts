import type { FastifyInstance } from 'fastify';
import { createTargetSchema, setAuthProfilesSchema } from '@dast/shared';
import type { Container } from '../../composition/container';
import { toTargetDto, toApiEndpointDto } from '../../../application/mappers/toDto';

export function registerTargetRoutes(app: FastifyInstance, c: Container): void {
  app.get('/api/targets', async () => {
    const targets = await c.useCases.listTargets.execute();
    return targets.map(toTargetDto);
  });

  app.post('/api/targets', async (req, reply) => {
    const input = createTargetSchema.parse(req.body);
    const target = await c.useCases.createTarget.execute(input);
    return reply.code(201).send(toTargetDto(target));
  });

  app.get('/api/targets/:id', async (req) => {
    const { id } = req.params as { id: string };
    return toTargetDto(await c.useCases.getTarget.execute(id));
  });

  app.get('/api/targets/:id/endpoints', async (req) => {
    const { id } = req.params as { id: string };
    await c.useCases.getTarget.execute(id); // 404 if the target is unknown
    const endpoints = await c.useCases.listEndpoints.execute(id);
    return endpoints.map(toApiEndpointDto);
  });

  // Set the target's test identities (headers are stored but never returned).
  app.put('/api/targets/:id/auth', async (req) => {
    const { id } = req.params as { id: string };
    const { authProfiles } = setAuthProfilesSchema.parse(req.body);
    const target = await c.useCases.setAuthProfiles.execute(id, authProfiles);
    return toTargetDto(target);
  });
}
