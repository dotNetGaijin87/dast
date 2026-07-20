import type { PrismaClient } from '@prisma/client';
import type {
  ScanRepository,
  CreateScanData,
  ScanPatch,
  ScanWithCounts,
} from '../../application/ports/ScanRepository';
import type { Scan } from '../../domain/entities/Scan';
import { emptySeverityCounts, type ScanStatus, type Severity } from '@dast/shared';

interface ScanRow {
  id: string;
  targetId: string;
  status: string;
  profile: string;
  progress: number;
  safeMode: boolean;
  startedAt: Date | null;
  finishedAt: Date | null;
  error: string | null;
  createdAt: Date;
}

function map(row: ScanRow): Scan {
  return {
    id: row.id,
    targetId: row.targetId,
    status: row.status as ScanStatus,
    profile: row.profile,
    progress: row.progress,
    safeMode: row.safeMode,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    error: row.error,
    createdAt: row.createdAt,
  };
}

export class PrismaScanRepository implements ScanRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateScanData): Promise<Scan> {
    const row = await this.prisma.scan.create({ data });
    return map(row);
  }

  async findById(id: string): Promise<Scan | null> {
    const row = await this.prisma.scan.findUnique({ where: { id } });
    return row ? map(row) : null;
  }

  async listForTarget(targetId: string): Promise<ScanWithCounts[]> {
    const rows = await this.prisma.scan.findMany({
      where: { targetId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { findings: true } } },
    });

    const scanIds = rows.map((r) => r.id);
    const grouped =
      scanIds.length > 0
        ? await this.prisma.finding.groupBy({
            by: ['scanId', 'severity'],
            where: { scanId: { in: scanIds } },
            _count: { _all: true },
          })
        : [];

    const bySeverity = new Map<string, ReturnType<typeof emptySeverityCounts>>();
    for (const g of grouped) {
      const counts = bySeverity.get(g.scanId) ?? emptySeverityCounts();
      counts[g.severity as Severity] = g._count._all;
      bySeverity.set(g.scanId, counts);
    }

    return rows.map((row) => ({
      ...map(row),
      findingsCount: row._count.findings,
      severityCounts: bySeverity.get(row.id) ?? emptySeverityCounts(),
    }));
  }

  async update(id: string, patch: ScanPatch): Promise<Scan> {
    const row = await this.prisma.scan.update({ where: { id }, data: patch });
    return map(row);
  }
}
