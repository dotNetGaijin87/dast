import type { FindingDraft } from '../../../../domain/entities/Finding';
import type { ActiveCheck } from '../types';
import { buildEndpointUrl, isSafeMethod } from '../../native/requestBuilder';
import { assertInScope } from '../../../../domain/services/ScopePolicy';

const BURST = 20;

/**
 * API4 — Unrestricted Resource Consumption. Sends a bounded burst of requests to
 * one read-only endpoint; if none are throttled (no 429), rate limiting is absent.
 */
export const rateLimitingCheck: ActiveCheck = async ({ burstProbe, ctx, log }) => {
  const endpoint = ctx.endpoints.find((e) => isSafeMethod(e.method));
  if (!endpoint) return [];

  const url = buildEndpointUrl(ctx.target.baseUrl, endpoint.path);
  try {
    assertInScope(ctx.target.scopeHosts, url);
  } catch {
    return [];
  }

  const headers = ctx.identities[0]?.headers;
  log(`rate-limit probe: ${BURST} rapid requests to ${endpoint.method} ${endpoint.path}`);

  let sent = 0;
  for (let i = 0; i < BURST; i++) {
    const r = await burstProbe.send({
      method: endpoint.method,
      url,
      path: endpoint.path,
      secured: endpoint.secured,
      headers,
    });
    sent += 1;
    if (r.status === 429) return []; // rate limiting present — good
    if (r.error !== undefined) break; // inconclusive
  }
  if (sent < BURST) return [];

  const finding: FindingDraft = {
    title: 'No rate limiting observed',
    description: `Sent ${BURST} rapid requests to ${endpoint.path} without any 429 Too Many Requests response.`,
    severity: 'medium',
    owaspCategory: 'API4:2023',
    engine: 'active',
    method: endpoint.method,
    path: endpoint.path,
    evidence: { requests: BURST, endpoint: `${endpoint.method} ${endpoint.path}` },
    remediation: 'Apply per-client rate limiting and resource quotas to API endpoints.',
  };
  return [finding];
};
