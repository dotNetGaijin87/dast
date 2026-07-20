import { Prisma, type PrismaClient } from '@prisma/client';
import type {
  TargetRepository,
  CreateTargetData,
  TargetWithCounts,
} from '../../application/ports/TargetRepository';
import type { Target } from '../../domain/entities/Target';
import type { AuthProfile } from '@dast/shared';

interface TargetRow {
  id: string;
  name: string;
  baseUrl: string;
  scopeHosts: string[];
  authProfiles: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}

function parseAuthProfiles(value: Prisma.JsonValue): AuthProfile[] {
  if (!Array.isArray(value)) return [];
  const profiles: AuthProfile[] = [];
  for (const item of value) {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const name = (item as Record<string, unknown>).name;
      const headers = (item as Record<string, unknown>).headers;
      if (typeof name === 'string' && headers && typeof headers === 'object') {
        profiles.push({ name, headers: headers as Record<string, string> });
      }
    }
  }
  return profiles;
}

function map(row: TargetRow): Target {
  return {
    id: row.id,
    name: row.name,
    baseUrl: row.baseUrl,
    scopeHosts: row.scopeHosts,
    authProfiles: parseAuthProfiles(row.authProfiles),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaTargetRepository implements TargetRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateTargetData): Promise<Target> {
    const row = await this.prisma.target.create({
      data: {
        name: data.name,
        baseUrl: data.baseUrl,
        scopeHosts: data.scopeHosts,
        authProfiles: data.authProfiles as unknown as Prisma.InputJsonValue,
      },
    });
    return map(row);
  }

  async findById(id: string): Promise<Target | null> {
    const row = await this.prisma.target.findUnique({ where: { id } });
    return row ? map(row) : null;
  }

  async list(): Promise<TargetWithCounts[]> {
    const rows = await this.prisma.target.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { endpoints: true } } },
    });
    return rows.map((row) => ({ ...map(row), endpointCount: row._count.endpoints }));
  }

  async setAuthProfiles(id: string, profiles: AuthProfile[]): Promise<Target> {
    const row = await this.prisma.target.update({
      where: { id },
      data: { authProfiles: profiles as unknown as Prisma.InputJsonValue },
    });
    return map(row);
  }
}
