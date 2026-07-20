import type { PrismaClient } from '@prisma/client';
import type {
  ApiEndpointRepository,
  NewEndpoint,
} from '../../application/ports/ApiEndpointRepository';
import type { ApiEndpoint } from '../../domain/entities/ApiEndpoint';
import type { HttpMethod } from '@dast/shared';

interface EndpointRow {
  id: string;
  targetId: string;
  method: string;
  path: string;
  operationId: string | null;
  summary: string | null;
  secured: boolean;
}

function map(row: EndpointRow): ApiEndpoint {
  return {
    id: row.id,
    targetId: row.targetId,
    method: row.method as HttpMethod,
    path: row.path,
    operationId: row.operationId,
    summary: row.summary,
    secured: row.secured,
  };
}

export class PrismaApiEndpointRepository implements ApiEndpointRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async replaceForTarget(targetId: string, endpoints: NewEndpoint[]): Promise<ApiEndpoint[]> {
    await this.prisma.$transaction([
      this.prisma.apiEndpoint.deleteMany({ where: { targetId } }),
      this.prisma.apiEndpoint.createMany({
        data: endpoints.map((e) => ({
          targetId,
          method: e.method,
          path: e.path,
          operationId: e.operationId,
          summary: e.summary,
          secured: e.secured,
        })),
      }),
    ]);
    return this.listForTarget(targetId);
  }

  async listForTarget(targetId: string): Promise<ApiEndpoint[]> {
    const rows = await this.prisma.apiEndpoint.findMany({
      where: { targetId },
      orderBy: [{ path: 'asc' }, { method: 'asc' }],
    });
    return rows.map(map);
  }
}
