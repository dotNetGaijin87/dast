import type { FindingDto, ScanDto, TargetDto, ApiEndpointDto, SeverityCounts } from '@dast/shared';
import type { Finding } from '../../domain/entities/Finding';
import type { Scan } from '../../domain/entities/Scan';
import type { Target } from '../../domain/entities/Target';
import type { ApiEndpoint } from '../../domain/entities/ApiEndpoint';

export function toFindingDto(f: Finding): FindingDto {
  return {
    id: f.id,
    scanId: f.scanId,
    title: f.title,
    description: f.description,
    severity: f.severity,
    owaspCategory: f.owaspCategory,
    engine: f.engine,
    method: f.method,
    path: f.path,
    evidence: f.evidence,
    remediation: f.remediation,
    status: f.status,
    createdAt: f.createdAt.toISOString(),
  };
}

export function toScanDto(
  s: Scan,
  findingsCount?: number,
  severityCounts?: SeverityCounts,
): ScanDto {
  return {
    id: s.id,
    targetId: s.targetId,
    status: s.status,
    profile: s.profile,
    progress: s.progress,
    safeMode: s.safeMode,
    startedAt: s.startedAt ? s.startedAt.toISOString() : null,
    finishedAt: s.finishedAt ? s.finishedAt.toISOString() : null,
    error: s.error,
    createdAt: s.createdAt.toISOString(),
    ...(findingsCount !== undefined ? { findingsCount } : {}),
    ...(severityCounts !== undefined ? { severityCounts } : {}),
  };
}

export function toTargetDto(t: Target & { endpointCount?: number }): TargetDto {
  return {
    id: t.id,
    name: t.name,
    baseUrl: t.baseUrl,
    scopeHosts: t.scopeHosts,
    // Only names are exposed — header values are sensitive.
    authProfileNames: t.authProfiles.map((p) => p.name),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    ...(t.endpointCount !== undefined ? { endpointCount: t.endpointCount } : {}),
  };
}

export function toApiEndpointDto(e: ApiEndpoint): ApiEndpointDto {
  return {
    id: e.id,
    method: e.method,
    path: e.path,
    operationId: e.operationId,
    summary: e.summary,
    secured: e.secured,
  };
}
