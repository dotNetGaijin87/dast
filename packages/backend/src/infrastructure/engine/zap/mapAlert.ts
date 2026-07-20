import type { Severity, OwaspApiCategory, HttpMethod } from '@dast/shared';
import type { FindingDraft } from '../../../domain/entities/Finding';
import type { ZapAlert } from './types';

export function mapZapRisk(risk: string): Severity {
  switch (risk.trim().toLowerCase()) {
    case 'high':
      return 'high';
    case 'medium':
      return 'medium';
    case 'low':
      return 'low';
    default:
      return 'info';
  }
}

/**
 * Best-effort mapping of a (web-oriented) ZAP alert onto the OWASP API Top 10.
 * ZAP's own alert name is preserved as the finding title, so nothing is lost.
 */
export function mapZapCategory(name: string): OwaspApiCategory {
  const n = name.toLowerCase();
  if (n.includes('server side request forgery') || n.includes('ssrf')) return 'API7:2023';
  if (n.includes('authentication') || n.includes('session') || n.includes('login')) return 'API2:2023';
  return 'API8:2023';
}

const METHODS = new Set<string>(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'TRACE']);

function toMethod(method: string | undefined): HttpMethod | null {
  if (!method) return null;
  const upper = method.toUpperCase();
  return METHODS.has(upper) ? (upper as HttpMethod) : null;
}

function toPath(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).pathname || '/';
  } catch {
    return url;
  }
}

export function mapZapAlert(alert: ZapAlert): FindingDraft {
  const name = alert.alert ?? alert.name ?? 'ZAP alert';
  return {
    title: name,
    description: alert.description?.trim() || name,
    severity: mapZapRisk(alert.risk),
    owaspCategory: mapZapCategory(name),
    engine: 'zap',
    method: toMethod(alert.method),
    path: toPath(alert.url),
    evidence: {
      url: alert.url ?? null,
      param: alert.param ?? null,
      evidence: alert.evidence ?? null,
      confidence: alert.confidence ?? null,
      cweid: alert.cweid ?? null,
      reference: alert.reference ?? null,
    },
    remediation: alert.solution?.trim() ? alert.solution.trim() : undefined,
  };
}
