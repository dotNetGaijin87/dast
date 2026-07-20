import { Prisma, type PrismaClient } from '@prisma/client';
import type { FindingRepository } from '../../application/ports/FindingRepository';
import type { Finding, FindingDraft } from '../../domain/entities/Finding';
import type {
  Severity,
  OwaspApiCategory,
  EngineName,
  HttpMethod,
  FindingStatus,
} from '@dast/shared';

interface FindingRow {
  id: string;
  scanId: string;
  title: string;
  description: string;
  severity: string;
  owaspCategory: string;
  engine: string;
  method: string | null;
  path: string | null;
  evidence: Prisma.JsonValue | null;
  remediation: string | null;
  status: string;
  createdAt: Date;
}

function map(row: FindingRow): Finding {
  return {
    id: row.id,
    scanId: row.scanId,
    title: row.title,
    description: row.description,
    severity: row.severity as Severity,
    owaspCategory: row.owaspCategory as OwaspApiCategory,
    engine: row.engine as EngineName,
    method: (row.method as HttpMethod | null) ?? null,
    path: row.path,
    evidence: (row.evidence as Record<string, unknown> | null) ?? null,
    remediation: row.remediation,
    status: row.status as FindingStatus,
    createdAt: row.createdAt,
  };
}

export class PrismaFindingRepository implements FindingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async addMany(scanId: string, drafts: FindingDraft[]): Promise<Finding[]> {
    if (drafts.length === 0) return [];
    const rows = await this.prisma.$transaction(
      drafts.map((d) =>
        this.prisma.finding.create({
          data: {
            scanId,
            title: d.title,
            description: d.description,
            severity: d.severity,
            owaspCategory: d.owaspCategory,
            engine: d.engine,
            method: d.method ?? null,
            path: d.path ?? null,
            evidence:
              d.evidence == null
                ? Prisma.JsonNull
                : (d.evidence as Prisma.InputJsonValue),
            remediation: d.remediation ?? null,
          },
        }),
      ),
    );
    return rows.map(map);
  }

  async listForScan(scanId: string): Promise<Finding[]> {
    const rows = await this.prisma.finding.findMany({
      where: { scanId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(map);
  }
}
