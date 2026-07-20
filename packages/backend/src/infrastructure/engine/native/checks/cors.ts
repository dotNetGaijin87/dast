import type { FindingDraft } from '../../../../domain/entities/Finding';
import type { ProbeResult } from '../types';
import { reached } from '../types';

export function checkCors(r: ProbeResult): FindingDraft[] {
  if (!reached(r)) return [];
  const acao = r.headers['access-control-allow-origin'];
  const acac = r.headers['access-control-allow-credentials'];
  if (acao !== '*') return [];

  const withCreds = acac === 'true';
  return [
    {
      title: withCreds
        ? 'Permissive CORS with credentials (ACAO: * and credentials allowed)'
        : 'Permissive CORS policy (Access-Control-Allow-Origin: *)',
      description:
        'The API allows any origin to read responses. Combined with credentialed requests this can leak data cross-origin.',
      severity: withCreds ? 'high' : 'medium',
      owaspCategory: 'API8:2023',
      engine: 'native',
      method: r.method,
      path: r.path,
      evidence: { 'access-control-allow-origin': acao, 'access-control-allow-credentials': acac ?? null },
      remediation: 'Restrict Access-Control-Allow-Origin to an explicit allow-list of trusted origins.',
    },
  ];
}
