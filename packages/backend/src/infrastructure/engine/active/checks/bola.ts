import type { FindingDraft } from '../../../../domain/entities/Finding';
import type { ActiveCheck } from '../types';
import { buildEndpointUrl, isSafeMethod } from '../../native/requestBuilder';
import { reached, type ProbeResult } from '../../native/types';
import { assertInScope } from '../../../../domain/services/ScopePolicy';

const ID_PARAM_RE = /\{[^}]*id[^}]*\}/i;

function isSuccess(r: ProbeResult): boolean {
  return reached(r) && r.status >= 200 && r.status < 300;
}

/**
 * API1 — Broken Object Level Authorization. Requires >=2 identities. If identity A
 * can read an object and identity B can read the *same* object identifier, per-object
 * authorization is likely missing. Heuristic — findings are for triage.
 */
export const bolaCheck: ActiveCheck = async ({ probe, ctx, log }) => {
  if (ctx.identities.length < 2) {
    log('BOLA: skipped (requires >=2 configured identities)');
    return [];
  }
  const identityA = ctx.identities[0]!;
  const identityB = ctx.identities[1]!;

  const targets = ctx.endpoints
    .filter((e) => isSafeMethod(e.method) && e.path.includes('{') && (ID_PARAM_RE.test(e.path) || e.secured))
    .slice(0, ctx.maxEndpoints);
  if (targets.length === 0) return [];

  log(`BOLA: cross-identity access on ${targets.length} object endpoint(s)`);
  const findings: FindingDraft[] = [];

  for (const e of targets) {
    const url = buildEndpointUrl(ctx.target.baseUrl, e.path);
    try {
      assertInScope(ctx.target.scopeHosts, url);
    } catch {
      continue;
    }

    const ra = await probe.send({ method: e.method, url, path: e.path, secured: e.secured, headers: identityA.headers });
    if (!isSuccess(ra)) continue;

    const rb = await probe.send({ method: e.method, url, path: e.path, secured: e.secured, headers: identityB.headers });
    if (isSuccess(rb)) {
      findings.push({
        title: 'Potential BOLA: object accessible by a second identity',
        description: `Both "${identityA.name}" and "${identityB.name}" received a success response for the same object at ${e.path}. Verify per-object ownership is enforced.`,
        severity: 'high',
        owaspCategory: 'API1:2023',
        engine: 'active',
        method: e.method,
        path: e.path,
        evidence: { url, identityA: identityA.name, identityB: identityB.name, statusA: ra.status, statusB: rb.status },
        remediation: 'Enforce object-level authorization: confirm the authenticated caller may access the specific object.',
      });
    }
  }
  return findings;
};
