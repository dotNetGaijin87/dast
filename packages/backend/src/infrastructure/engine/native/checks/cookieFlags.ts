import type { FindingDraft } from '../../../../domain/entities/Finding';
import type { ProbeResult } from '../types';

function cookieName(setCookie: string): string {
  const eq = setCookie.indexOf('=');
  return eq > 0 ? setCookie.slice(0, eq).trim() : setCookie.trim();
}

export function checkCookieFlags(r: ProbeResult): FindingDraft[] {
  const findings: FindingDraft[] = [];
  for (const cookie of r.setCookies) {
    const lower = cookie.toLowerCase();
    const missing: string[] = [];
    if (!lower.includes('secure')) missing.push('Secure');
    if (!lower.includes('httponly')) missing.push('HttpOnly');
    if (!lower.includes('samesite')) missing.push('SameSite');
    if (missing.length === 0) continue;

    findings.push({
      title: `Cookie "${cookieName(cookie)}" missing ${missing.join(', ')}`,
      description:
        'A Set-Cookie response omits recommended security attributes, weakening protection against theft and CSRF.',
      severity: 'medium',
      owaspCategory: 'API8:2023',
      engine: 'native',
      method: r.method,
      path: r.path,
      evidence: { cookie: cookieName(cookie), missing },
      remediation: 'Set Secure, HttpOnly and SameSite attributes on session cookies.',
    });
  }
  return findings;
}
