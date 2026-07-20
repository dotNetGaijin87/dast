import type { FindingDraft } from '../../../../domain/entities/Finding';
import type { ProbeResult } from '../types';
import { reached } from '../types';

const BANNER_HEADERS = ['server', 'x-powered-by', 'x-aspnet-version', 'x-aspnetmvc-version'];

export function checkServerBanner(r: ProbeResult): FindingDraft[] {
  if (!reached(r)) return [];
  const disclosed: Record<string, string> = {};
  for (const h of BANNER_HEADERS) {
    const value = r.headers[h];
    if (value !== undefined && value.trim() !== '') disclosed[h] = value;
  }
  if (Object.keys(disclosed).length === 0) return [];

  return [
    {
      title: 'Technology/version disclosure in response headers',
      description:
        'Response headers reveal server software or framework versions, helping an attacker target known vulnerabilities.',
      severity: 'low',
      owaspCategory: 'API8:2023',
      engine: 'native',
      method: r.method,
      path: r.path,
      evidence: disclosed,
      remediation: 'Remove or normalize Server / X-Powered-By and similar version headers.',
    },
  ];
}
