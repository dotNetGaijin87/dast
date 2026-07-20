import { buildContainer } from '../composition/container';
import { buildServer } from './server';

async function main(): Promise<void> {
  const container = buildContainer();
  const app = await buildServer(container);

  const address = await app.listen({ port: container.env.API_PORT, host: '0.0.0.0' });
  container.logger.info({ address }, 'API listening');

  const shutdown = async (signal: string): Promise<void> => {
    container.logger.info({ signal }, 'shutting down API');
    await app.close();
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
