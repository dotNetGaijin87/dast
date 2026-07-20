import type { FindingDraft } from '../../../../domain/entities/Finding';
import type { HttpMethod } from '@dast/shared';
import type { ActiveCheck } from '../types';
import { buildEndpointUrl } from '../../native/requestBuilder';
import { reached } from '../../native/types';
import { assertInScope } from '../../../../domain/services/ScopePolicy';

const WRITE_METHODS: HttpMethod[] = ['POST', 'PUT', 'PATCH'];
const INJECTED = { role: 'admin', is_admin: true, isAdmin: true, admin: true, verified: true };
const ECHO_RE = /"(role|is_?admin|isadmin|verified)"\s*:\s*("admin"|true)/i;

/**
 * API3 — Broken Object Property Level Authorization (mass assignment). MUTATING:
 * only runs when safe mode is OFF. Sends privileged fields in the body and flags if
 * the server appears to accept/echo them.
 */
export const massAssignmentCheck: ActiveCheck = async ({ probe, ctx, log }) => {
  if (ctx.safeMode) {
    log('mass-assignment: skipped (safe mode — this check mutates state)');
    return [];
  }

  const writes = ctx.endpoints
    .filter((e) => WRITE_METHODS.includes(e.method))
    .slice(0, ctx.maxEndpoints);
  if (writes.length === 0) return [];

  const headers = ctx.identities[0]?.headers;
  log(`mass-assignment: probing ${writes.length} write endpoint(s)`);
  const findings: FindingDraft[] = [];

  for (const e of writes) {
    const url = buildEndpointUrl(ctx.target.baseUrl, e.path);
    try {
      assertInScope(ctx.target.scopeHosts, url);
    } catch {
      continue;
    }

    const r = await probe.send({
      method: e.method,
      url,
      path: e.path,
      secured: e.secured,
      headers,
      body: INJECTED,
    });
    if (reached(r) && r.status >= 200 && r.status < 300 && ECHO_RE.test(r.bodyText)) {
      findings.push({
        title: 'Potential mass assignment (privileged field accepted)',
        description: `A write to ${e.path} with injected privileged fields returned a success response echoing one of them.`,
        severity: 'high',
        owaspCategory: 'API3:2023',
        engine: 'active',
        method: e.method,
        path: e.path,
        evidence: { url, status: r.status, injected: Object.keys(INJECTED) },
        remediation: 'Bind only allow-listed fields from request bodies; never accept privileged attributes from clients.',
      });
    }
  }
  return findings;
};
