import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { ZodError } from 'zod';
import type { Container } from '../composition/container';
import {
  DomainError,
  NotFoundError,
  ValidationError,
  AuthorizationScopeError,
} from '../../domain/errors/DomainError';
import { registerHealthRoutes } from './routes/health';
import { registerTargetRoutes } from './routes/targets';
import { registerSpecRoutes } from './routes/specs';
import { registerScanRoutes } from './routes/scans';
import { registerEventRoutes } from './routes/events';

export async function buildServer(container: Container): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
    // OpenAPI specs pasted as text can be large.
    bodyLimit: 12 * 1024 * 1024,
  });

  await app.register(cors, {
    origin: container.env.CORS_ORIGIN === '*' ? true : container.env.CORS_ORIGIN.split(','),
  });
  await app.register(sensible);

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof ZodError) {
      return reply
        .code(400)
        .send({ error: 'ValidationError', message: 'Invalid request.', details: err.issues });
    }
    if (err instanceof NotFoundError) {
      return reply.code(404).send({ error: 'NotFound', message: err.message });
    }
    if (err instanceof AuthorizationScopeError) {
      return reply.code(403).send({ error: 'ScopeViolation', message: err.message });
    }
    if (err instanceof ValidationError) {
      return reply.code(400).send({ error: 'ValidationError', message: err.message });
    }
    if (err instanceof DomainError) {
      return reply.code(400).send({ error: err.code, message: err.message });
    }
    container.logger.error({ err }, 'unhandled error');
    return reply.code(500).send({ error: 'InternalServerError', message: 'Unexpected error.' });
  });

  registerHealthRoutes(app, container);
  registerTargetRoutes(app, container);
  registerSpecRoutes(app, container);
  registerScanRoutes(app, container);
  registerEventRoutes(app, container);

  return app;
}
