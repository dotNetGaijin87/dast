import { describe, it, expect } from 'vitest';
import type { HttpMethod, AuthProfile } from '@dast/shared';
import type { ScanContext } from '../../../application/ports/ScannerEngine';
import type { ApiEndpoint } from '../../../domain/entities/ApiEndpoint';
import type { Probe, ProbeRequest, ProbeResult } from '../native/types';
import { rateLimitingCheck } from './checks/rateLimiting';
import { functionAuthzCheck } from './checks/functionAuthz';
import { bolaCheck } from './checks/bola';
import { massAssignmentCheck } from './checks/massAssignment';

class StubProbe implements Probe {
  readonly calls: ProbeRequest[] = [];
  constructor(private readonly handler: (req: ProbeRequest) => Partial<ProbeResult>) {}
  async send(req: ProbeRequest): Promise<ProbeResult> {
    this.calls.push(req);
    const base: ProbeResult = {
      method: req.method,
      url: req.url,
      path: req.path,
      status: 200,
      headers: {},
      setCookies: [],
      bodyText: '',
      secured: req.secured,
    };
    return { ...base, ...this.handler(req) };
  }
}

const noop = (): void => undefined;

function ep(method: HttpMethod, path: string, secured = false): ApiEndpoint {
  return { id: path, targetId: 't', method, path, operationId: null, summary: null, secured };
}

function identity(name: string, auth = `Bearer ${name}`): AuthProfile {
  return { name, headers: { Authorization: auth } };
}

function makeCtx(overrides: Partial<ScanContext>): ScanContext {
  return {
    target: { id: 't', baseUrl: 'https://api.test', scopeHosts: ['api.test'] },
    endpoints: [],
    safeMode: true,
    profile: 'full',
    identities: [],
    requestsPerSecond: 100,
    maxEndpoints: 50,
    ...overrides,
  };
}

function deps(probe: Probe, ctx: ScanContext) {
  return { probe, burstProbe: probe, ctx, log: noop };
}

describe('rateLimitingCheck', () => {
  it('flags when no 429 is ever returned', async () => {
    const probe = new StubProbe(() => ({ status: 200 }));
    const findings = await rateLimitingCheck(deps(probe, makeCtx({ endpoints: [ep('GET', '/ping')] })));
    expect(findings).toHaveLength(1);
    expect(findings[0]?.owaspCategory).toBe('API4:2023');
  });
  it('is quiet when a 429 appears', async () => {
    let n = 0;
    const probe = new StubProbe(() => ({ status: ++n >= 3 ? 429 : 200 }));
    const findings = await rateLimitingCheck(deps(probe, makeCtx({ endpoints: [ep('GET', '/ping')] })));
    expect(findings).toHaveLength(0);
  });
});

describe('functionAuthzCheck', () => {
  it('flags an admin endpoint reachable unauthenticated as high', async () => {
    const probe = new StubProbe(() => ({ status: 200 }));
    const findings = await functionAuthzCheck(deps(probe, makeCtx({ endpoints: [ep('GET', '/admin/users')] })));
    expect(findings[0]?.severity).toBe('high');
  });
  it('flags an admin endpoint reachable via an identity as medium', async () => {
    const probe = new StubProbe((req) => ({ status: req.headers?.['Authorization'] ? 200 : 401 }));
    const ctx = makeCtx({ endpoints: [ep('GET', '/admin')], identities: [identity('u')] });
    const findings = await functionAuthzCheck(deps(probe, ctx));
    expect(findings[0]?.severity).toBe('medium');
  });
  it('ignores non-privileged paths', async () => {
    const probe = new StubProbe(() => ({ status: 200 }));
    const findings = await functionAuthzCheck(deps(probe, makeCtx({ endpoints: [ep('GET', '/users')] })));
    expect(findings).toHaveLength(0);
  });
});

describe('bolaCheck', () => {
  it('flags an object accessible by a second identity', async () => {
    const probe = new StubProbe(() => ({ status: 200 }));
    const ctx = makeCtx({
      endpoints: [ep('GET', '/orders/{id}', true)],
      identities: [identity('a'), identity('b')],
    });
    const findings = await bolaCheck(deps(probe, ctx));
    expect(findings[0]?.owaspCategory).toBe('API1:2023');
  });
  it('skips with fewer than two identities', async () => {
    const probe = new StubProbe(() => ({ status: 200 }));
    const ctx = makeCtx({ endpoints: [ep('GET', '/orders/{id}', true)], identities: [identity('a')] });
    expect(await bolaCheck(deps(probe, ctx))).toHaveLength(0);
  });
  it('is quiet when the second identity is denied', async () => {
    const probe = new StubProbe((req) => ({
      status: req.headers?.['Authorization'] === 'Bearer a' ? 200 : 403,
    }));
    const ctx = makeCtx({
      endpoints: [ep('GET', '/orders/{id}', true)],
      identities: [identity('a'), identity('b')],
    });
    expect(await bolaCheck(deps(probe, ctx))).toHaveLength(0);
  });
});

describe('massAssignmentCheck', () => {
  it('flags an echoed privileged field when safe mode is off', async () => {
    const probe = new StubProbe(() => ({ status: 201, bodyText: '{"id":1,"role":"admin"}' }));
    const ctx = makeCtx({ endpoints: [ep('POST', '/users')], safeMode: false });
    const findings = await massAssignmentCheck(deps(probe, ctx));
    expect(findings[0]?.owaspCategory).toBe('API3:2023');
  });
  it('never mutates in safe mode', async () => {
    const probe = new StubProbe(() => ({ status: 201, bodyText: '{"role":"admin"}' }));
    const ctx = makeCtx({ endpoints: [ep('POST', '/users')], safeMode: true });
    const findings = await massAssignmentCheck(deps(probe, ctx));
    expect(findings).toHaveLength(0);
    expect(probe.calls).toHaveLength(0);
  });
});
