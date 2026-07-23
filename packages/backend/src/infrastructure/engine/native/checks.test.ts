import { describe, it, expect } from 'vitest';
import type { ProbeResult } from './types';
import { checkSecurityHeaders } from './checks/securityHeaders';
import { checkCors } from './checks/cors';
import { checkAuthEnforcement } from './checks/authEnforcement';
import { checkInfoDisclosure } from './checks/infoDisclosure';
import { checkCookieFlags } from './checks/cookieFlags';
import { checkInsecureTransport } from './checks/insecureTransport';

function makeResult(overrides: Partial<ProbeResult> = {}): ProbeResult {
  return {
    method: 'GET',
    url: 'https://api.example.com/',
    path: '/',
    status: 200,
    headers: {},
    setCookies: [],
    bodyText: '',
    secured: false,
    ...overrides,
  };
}

describe('checkSecurityHeaders', () => {
  it('flags each missing header (incl. HSTS on https)', () => {
    expect(checkSecurityHeaders(makeResult())).toHaveLength(4);
  });
  it('returns nothing when all headers are present', () => {
    const r = makeResult({
      headers: {
        'content-security-policy': "default-src 'self'",
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
        'strict-transport-security': 'max-age=31536000',
      },
    });
    expect(checkSecurityHeaders(r)).toHaveLength(0);
  });
});

describe('checkCors', () => {
  it('flags wildcard origin as medium', () => {
    const [f] = checkCors(makeResult({ headers: { 'access-control-allow-origin': '*' } }));
    expect(f?.severity).toBe('medium');
  });
  it('escalates to high when credentials are allowed', () => {
    const [f] = checkCors(
      makeResult({
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-credentials': 'true',
        },
      }),
    );
    expect(f?.severity).toBe('high');
  });
});

describe('checkAuthEnforcement', () => {
  it('flags a secured endpoint that returns 2xx unauthenticated', () => {
    expect(checkAuthEnforcement(makeResult({ secured: true, status: 200 }))).toHaveLength(1);
  });
  it('is quiet when the endpoint rejects the request', () => {
    expect(checkAuthEnforcement(makeResult({ secured: true, status: 401 }))).toHaveLength(0);
  });
  it('is quiet for unsecured endpoints', () => {
    expect(checkAuthEnforcement(makeResult({ secured: false, status: 200 }))).toHaveLength(0);
  });
});

describe('checkInfoDisclosure', () => {
  it('detects a stack trace', () => {
    const r = makeResult({ bodyText: 'Traceback (most recent call last):\n  File ...' });
    expect(checkInfoDisclosure(r)).toHaveLength(1);
  });
  it('detects secret material as critical', () => {
    const [f] = checkInfoDisclosure(makeResult({ bodyText: 'key=AKIAIOSFODNN7EXAMPLE' }));
    expect(f?.severity).toBe('critical');
  });
  it('is quiet on clean bodies', () => {
    expect(checkInfoDisclosure(makeResult({ bodyText: '{"ok":true}' }))).toHaveLength(0);
  });
});

describe('checkCookieFlags', () => {
  it('flags a cookie missing security attributes', () => {
    expect(checkCookieFlags(makeResult({ setCookies: ['sid=abc'] }))).toHaveLength(1);
  });
  it('accepts a fully-attributed cookie', () => {
    const r = makeResult({ setCookies: ['sid=abc; Secure; HttpOnly; SameSite=Lax'] });
    expect(checkCookieFlags(r)).toHaveLength(0);
  });
  it('does not count attribute names appearing in the cookie name or value', () => {
    const r = makeResult({ setCookies: ['secure_sid=httponly-samesite; Path=/'] });
    const [finding] = checkCookieFlags(r);
    expect(finding?.evidence).toMatchObject({
      cookie: 'secure_sid',
      missing: ['Secure', 'HttpOnly', 'SameSite'],
    });
  });
});

describe('checkInsecureTransport', () => {
  it('flags cleartext http', () => {
    expect(checkInsecureTransport(makeResult({ url: 'http://api.example.com/' }))).toHaveLength(1);
  });
  it('accepts https', () => {
    expect(checkInsecureTransport(makeResult())).toHaveLength(0);
  });
});
