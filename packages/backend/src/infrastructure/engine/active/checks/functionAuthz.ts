import type { Severity } from '@dast/shared';
import type { FindingDraft } from '../../../../domain/entities/Finding';
import type { ApiEndpoint } from '../../../../domain/entities/ApiEndpoint';
import type { ActiveCheck } from '../types';
import { buildEndpointUrl, isSafeMethod } from '../../native/requestBuilder';
import { reached, type ProbeResult } from '../../native/types';
import { assertInScope } from '../../../../domain/services/ScopePolicy';

const ADMIN_RE = /(^|\/)(admin|administrator|internal|manage|management|actuator|debug|config|metrics)(\/|$)/i;

function finding(e: ApiEndpoint, r: ProbeResult, severity: Severity, how: string): FindingDraft {
  return {
    title: 'Privileged endpoint accessible (broken function-level authorization)',
    description: `A privileged-looking endpoint returned a success response ${how}.`,
    severity,
    owaspCategory: 'API5:2023',
    engine: 'active',
    method: e.method,
    path: e.path,
    evidence: { url: r.url, status: r.status, access: how },
    remediation: 'Enforce role-based authorization on administrative/internal operations.',
  };
}

function isSuccess(r: ProbeResult): boolean {
  return reached(r) && r.status >= 200 && r.status < 300;
}

/** API5 — Broken Function Level Authorization. */
export const functionAuthzCheck: ActiveCheck = async ({ probe, ctx, log }) => {
  const admin = ctx.endpoints
    .filter((e) => isSafeMethod(e.method) && ADMIN_RE.test(e.path))
    .slice(0, ctx.maxEndpoints);
  if (admin.length === 0) return [];

  log(`function-level authz: probing ${admin.length} privileged-looking endpoint(s)`);
  const findings: FindingDraft[] = [];

  for (const e of admin) {
    const url = buildEndpointUrl(ctx.target.baseUrl, e.path);
    try {
      assertInScope(ctx.target.scopeHosts, url);
    } catch {
      continue;
    }

    const unauth = await probe.send({ method: e.method, url, path: e.path, secured: e.secured });
    if (isSuccess(unauth)) {
      findings.push(finding(e, unauth, 'high', 'without authentication'));
      continue;
    }

    for (const identity of ctx.identities) {
      const r = await probe.send({
        method: e.method,
        url,
        path: e.path,
        secured: e.secured,
        headers: identity.headers,
      });
      if (isSuccess(r)) {
        findings.push(finding(e, r, 'medium', `as identity "${identity.name}"`));
        break;
      }
    }
  }
  return findings;
};
