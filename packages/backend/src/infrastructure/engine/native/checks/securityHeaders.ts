import type { Severity } from '@dast/shared';
import type { FindingDraft } from '../../../../domain/entities/Finding';
import type { ProbeResult } from '../types';
import { reached } from '../types';

interface HeaderRule {
  header: string;
  httpsOnly?: boolean;
  title: string;
  description: string;
  remediation: string;
  severity: Severity;
}

const RULES: HeaderRule[] = [
  {
    header: 'content-security-policy',
    title: 'Missing Content-Security-Policy header',
    description:
      'Responses do not set a Content-Security-Policy, removing a defense-in-depth control against content injection.',
    remediation: 'Set a restrictive Content-Security-Policy header on responses.',
    severity: 'medium',
  },
  {
    header: 'x-content-type-options',
    title: 'Missing X-Content-Type-Options header',
    description:
      'Without "nosniff", browsers may MIME-sniff responses, enabling content-type confusion attacks.',
    remediation: 'Set "X-Content-Type-Options: nosniff".',
    severity: 'low',
  },
  {
    header: 'x-frame-options',
    title: 'Missing X-Frame-Options header',
    description: 'Responses can be framed by other origins, enabling clickjacking.',
    remediation: 'Set "X-Frame-Options: DENY" or a CSP frame-ancestors directive.',
    severity: 'low',
  },
  {
    header: 'strict-transport-security',
    httpsOnly: true,
    title: 'Missing Strict-Transport-Security header',
    description: 'HTTPS responses do not set HSTS, allowing downgrade to plaintext HTTP.',
    remediation: 'Set "Strict-Transport-Security: max-age=31536000; includeSubDomains".',
    severity: 'medium',
  },
];

export function checkSecurityHeaders(r: ProbeResult): FindingDraft[] {
  if (!reached(r)) return [];
  const isHttps = r.url.startsWith('https://');
  const findings: FindingDraft[] = [];
  for (const rule of RULES) {
    if (rule.httpsOnly && !isHttps) continue;
    if (r.headers[rule.header] === undefined) {
      findings.push({
        title: rule.title,
        description: rule.description,
        severity: rule.severity,
        owaspCategory: 'API8:2023',
        engine: 'native',
        method: r.method,
        path: r.path,
        evidence: { missingHeader: rule.header, url: r.url, status: r.status },
        remediation: rule.remediation,
      });
    }
  }
  return findings;
}
