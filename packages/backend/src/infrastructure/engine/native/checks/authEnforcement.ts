import type { FindingDraft } from '../../../../domain/entities/Finding';
import type { ProbeResult } from '../types';
import { reached } from '../types';

/**
 * If the spec marks an operation as requiring authentication but an
 * unauthenticated request still succeeds (2xx), authentication is not enforced.
 */
export function checkAuthEnforcement(r: ProbeResult): FindingDraft[] {
  if (!reached(r) || !r.secured) return [];
  if (r.status < 200 || r.status >= 300) return [];

  return [
    {
      title: 'Secured endpoint reachable without authentication',
      description:
        'The OpenAPI spec declares a security requirement for this operation, but an unauthenticated request returned a success response.',
      severity: 'high',
      owaspCategory: 'API2:2023',
      engine: 'native',
      method: r.method,
      path: r.path,
      evidence: { url: r.url, status: r.status },
      remediation: 'Enforce authentication server-side for every operation that declares a security scheme.',
    },
  ];
}
