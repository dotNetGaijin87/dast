import type { ZapAlert } from './types';

export interface ZapClientOptions {
  baseUrl: string;
  apiKey?: string;
  requestTimeoutMs?: number;
}

/** Thin wrapper over the OWASP ZAP JSON REST API. */
export class ZapClient {
  constructor(private readonly opts: ZapClientOptions) {}

  private async call(
    component: string,
    kind: 'view' | 'action',
    name: string,
    params: Record<string, string> = {},
  ): Promise<Record<string, unknown>> {
    const url = new URL(`${this.opts.baseUrl.replace(/\/+$/, '')}/JSON/${component}/${kind}/${name}/`);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

    const res = await fetch(url, {
      headers: this.opts.apiKey ? { 'X-ZAP-API-Key': this.opts.apiKey } : {},
      signal: AbortSignal.timeout(this.opts.requestTimeoutMs ?? 15_000),
    });
    if (!res.ok) throw new Error(`ZAP ${component}/${name} responded ${res.status}`);
    return (await res.json()) as Record<string, unknown>;
  }

  async version(): Promise<string> {
    const r = await this.call('core', 'view', 'version');
    return String(r['version'] ?? '');
  }

  /** Ask ZAP to fetch a URL through itself, populating the sites tree. */
  async accessUrl(target: string): Promise<void> {
    await this.call('core', 'action', 'accessUrl', { url: target, followRedirects: 'false' });
  }

  async passiveRecordsToScan(): Promise<number> {
    const r = await this.call('pscan', 'view', 'recordsToScan');
    return Number(r['recordsToScan'] ?? 0);
  }

  async startActiveScan(target: string): Promise<string> {
    const r = await this.call('ascan', 'action', 'scan', {
      url: target,
      recurse: 'true',
      inScopeOnly: 'false',
    });
    return String(r['scan'] ?? '');
  }

  async activeScanStatus(scanId: string): Promise<number> {
    const r = await this.call('ascan', 'view', 'status', { scanId });
    return Number(r['status'] ?? 0);
  }

  async alerts(baseurl: string, count = 1000): Promise<ZapAlert[]> {
    const r = await this.call('core', 'view', 'alerts', {
      baseurl,
      start: '0',
      count: String(count),
    });
    const alerts = r['alerts'];
    return Array.isArray(alerts) ? (alerts as ZapAlert[]) : [];
  }
}
