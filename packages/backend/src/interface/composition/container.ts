import type { PrismaClient } from '@prisma/client';
import type IORedis from 'ioredis';
import { loadEnv, type Env } from '../../infrastructure/config/env';
import { createPino, toLogger } from '../../infrastructure/logging/pinoLogger';
import { createPrisma } from '../../infrastructure/persistence/prisma';
import { createRedis } from '../../infrastructure/redis';
import { PrismaTargetRepository } from '../../infrastructure/persistence/PrismaTargetRepository';
import { PrismaApiEndpointRepository } from '../../infrastructure/persistence/PrismaApiEndpointRepository';
import { PrismaScanRepository } from '../../infrastructure/persistence/PrismaScanRepository';
import { PrismaFindingRepository } from '../../infrastructure/persistence/PrismaFindingRepository';
import { SwaggerParserAdapter } from '../../infrastructure/spec/SwaggerParserAdapter';
import { BullMqJobQueue } from '../../infrastructure/queue/BullMqJobQueue';
import { RedisEventBus } from '../../infrastructure/events/RedisEventBus';
import { NativeEngine } from '../../infrastructure/engine/NativeEngine';
import { ActiveEngine } from '../../infrastructure/engine/ActiveEngine';
import { ZapEngine } from '../../infrastructure/engine/ZapEngine';
import type { Logger } from '../../application/ports/Logger';
import type { ScannerEngine } from '../../application/ports/ScannerEngine';
import { CreateTarget } from '../../application/use-cases/CreateTarget';
import { ListTargets } from '../../application/use-cases/ListTargets';
import { GetTarget } from '../../application/use-cases/GetTarget';
import { SetAuthProfiles } from '../../application/use-cases/SetAuthProfiles';
import { ImportOpenApiSpec } from '../../application/use-cases/ImportOpenApiSpec';
import { ListEndpoints } from '../../application/use-cases/ListEndpoints';
import { StartScan } from '../../application/use-cases/StartScan';
import { ListScans } from '../../application/use-cases/ListScans';
import { GetScan } from '../../application/use-cases/GetScan';
import { ListFindings } from '../../application/use-cases/ListFindings';
import { RunScan } from '../../application/use-cases/RunScan';

export interface UseCases {
  createTarget: CreateTarget;
  listTargets: ListTargets;
  getTarget: GetTarget;
  setAuthProfiles: SetAuthProfiles;
  importSpec: ImportOpenApiSpec;
  listEndpoints: ListEndpoints;
  startScan: StartScan;
  listScans: ListScans;
  getScan: GetScan;
  listFindings: ListFindings;
}

export interface Container {
  env: Env;
  logger: Logger;
  prisma: PrismaClient;
  eventBus: RedisEventBus;
  queue: BullMqJobQueue;
  useCases: UseCases;
  runScan: RunScan;
  shutdown(): Promise<void>;
}

/** Composition root: builds every adapter and use case and wires them together. */
export function buildContainer(): Container {
  const env = loadEnv();
  const pino = createPino({ level: env.LOG_LEVEL, pretty: env.NODE_ENV === 'development' });
  const logger = toLogger(pino);

  const prisma = createPrisma();
  const queueConnection = createRedis(env.REDIS_URL);
  const pubConnection = createRedis(env.REDIS_URL);
  const subConnections: IORedis[] = [];

  const eventBus = new RedisEventBus(pubConnection, () => {
    const conn = createRedis(env.REDIS_URL);
    subConnections.push(conn);
    return conn;
  });
  const queue = new BullMqJobQueue(queueConnection);

  const targets = new PrismaTargetRepository(prisma);
  const endpoints = new PrismaApiEndpointRepository(prisma);
  const scans = new PrismaScanRepository(prisma);
  const findings = new PrismaFindingRepository(prisma);
  const parser = new SwaggerParserAdapter();

  const engines: ScannerEngine[] = [
    new NativeEngine(),
    new ActiveEngine(),
    new ZapEngine({
      baseUrl: env.ZAP_BASE_URL,
      apiKey: env.ZAP_API_KEY,
      timeoutMs: env.ZAP_TIMEOUT_MS,
    }),
  ];

  const useCases: UseCases = {
    createTarget: new CreateTarget(targets),
    listTargets: new ListTargets(targets),
    getTarget: new GetTarget(targets),
    setAuthProfiles: new SetAuthProfiles(targets),
    importSpec: new ImportOpenApiSpec(targets, endpoints, parser),
    listEndpoints: new ListEndpoints(endpoints),
    startScan: new StartScan(targets, scans, endpoints, queue),
    listScans: new ListScans(scans),
    getScan: new GetScan(scans),
    listFindings: new ListFindings(findings),
  };

  const runScan = new RunScan(scans, targets, endpoints, findings, engines, eventBus, logger, {
    requestsPerSecond: env.SCAN_REQUESTS_PER_SECOND,
    maxEndpoints: env.SCAN_MAX_ENDPOINTS,
  });

  return {
    env,
    logger,
    prisma,
    eventBus,
    queue,
    useCases,
    runScan,
    async shutdown() {
      await queue.close().catch(() => undefined);
      await prisma.$disconnect().catch(() => undefined);
      queueConnection.disconnect();
      pubConnection.disconnect();
      for (const conn of subConnections) conn.disconnect();
    },
  };
}
