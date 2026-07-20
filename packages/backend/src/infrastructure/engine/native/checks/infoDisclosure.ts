import type { Severity, OwaspApiCategory } from '@dast/shared';
import type { FindingDraft } from '../../../../domain/entities/Finding';
import type { ProbeResult } from '../types';
import { reached } from '../types';

interface DisclosureRule {
  id: string;
  regex: RegExp;
  title: string;
  description: string;
  severity: Severity;
  owaspCategory: OwaspApiCategory;
  remediation: string;
}

const RULES: DisclosureRule[] = [
  {
    id: 'stack-trace',
    regex:
      /(Traceback \(most recent call last\)|at [\w$.]+\([^)]*:\d+:\d+\)|java\.lang\.[A-Za-z.]+Exception|org\.springframework|System\.Web|PHP (Warning|Fatal error))/,
    title: 'Verbose error / stack trace disclosure',
    description:
      'A response body contains a stack trace or framework error output, leaking internal implementation details.',
    severity: 'medium',
    owaspCategory: 'API8:2023',
    remediation: 'Return generic error responses; log details server-side only.',
  },
  {
    id: 'sql-error',
    regex: /(SQLSTATE\[|You have an error in your SQL syntax|ORA-\d{5}|Npgsql\.|SqlException|unterminated quoted string)/,
    title: 'Database error message disclosure',
    description:
      'A response body contains a database error message, which can reveal schema details and indicate injection exposure.',
    severity: 'high',
    owaspCategory: 'API8:2023',
    remediation: 'Suppress raw database errors and use parameterized queries.',
  },
  {
    id: 'secret-material',
    regex: /(-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|AKIA[0-9A-Z]{16})/,
    title: 'Secret material exposed in response',
    description: 'A response body appears to contain a private key or cloud access key.',
    severity: 'critical',
    owaspCategory: 'API3:2023',
    remediation: 'Never return secrets in API responses; rotate any exposed credentials immediately.',
  },
];

export function checkInfoDisclosure(r: ProbeResult): FindingDraft[] {
  if (!reached(r) || r.bodyText === '') return [];
  const findings: FindingDraft[] = [];
  for (const rule of RULES) {
    const match = rule.regex.exec(r.bodyText);
    if (!match) continue;
    findings.push({
      title: rule.title,
      description: rule.description,
      severity: rule.severity,
      owaspCategory: rule.owaspCategory,
      engine: 'native',
      method: r.method,
      path: r.path,
      evidence: { url: r.url, status: r.status, match: match[0].slice(0, 160) },
      remediation: rule.remediation,
    });
  }
  return findings;
}
