import type { FindingDraft } from '../../../../domain/entities/Finding';
import type { ProbeResult } from '../types';

export function checkInsecureTransport(r: ProbeResult): FindingDraft[] {
  if (!r.url.startsWith('http://')) return [];
  return [
    {
      title: 'API served over cleartext HTTP',
      description:
        'The target responds over unencrypted HTTP, exposing credentials and data to network interception and tampering.',
      severity: 'high',
      owaspCategory: 'API8:2023',
      engine: 'native',
      method: r.method,
      path: r.path,
      evidence: { url: r.url },
      remediation: 'Serve the API exclusively over HTTPS and redirect HTTP to HTTPS.',
    },
  ];
}
