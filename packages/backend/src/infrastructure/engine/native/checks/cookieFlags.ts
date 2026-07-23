import type { FindingDraft } from '../../../../domain/entities/Finding';
import type { ProbeResult } from '../types';

function cookieName(setCookie: string): string {
  const pair = setCookie.split(';', 1)[0] ?? '';
  const eq = pair.indexOf('=');
  return eq > 0 ? pair.slice(0, eq).trim() : pair.trim();
}

/**
 * Attribute names of a Set-Cookie header, lowercased. The first segment is the
 * cookie name/value pair and is skipped, so a cookie called "secure_sid" or one
 * whose value contains "httponly" is not mistaken for a flagged cookie.
 */
function cookieAttributes(setCookie: string): Set<string> {
  const attrs = setCookie
    .split(';')
    .slice(1)
    .map((segment) => segment.split('=', 1)[0]!.trim().toLowerCase())
    .filter((name) => name.length > 0);
  return new Set(attrs);
}

export function checkCookieFlags(r: ProbeResult): FindingDraft[] {
  const findings: FindingDraft[] = [];
  for (const cookie of r.setCookies) {
    const attributes = cookieAttributes(cookie);
    const missing: string[] = [];
    if (!attributes.has('secure')) missing.push('Secure');
    if (!attributes.has('httponly')) missing.push('HttpOnly');
    if (!attributes.has('samesite')) missing.push('SameSite');
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
