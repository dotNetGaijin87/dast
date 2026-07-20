import type { RateLimiter } from './RateLimiter';
import type { ProbeRequest, ProbeResult, Probe } from './types';

const MAX_BODY_BYTES = 64 * 1024;

/** Throttled, bounded HTTP client used by the scan engines. */
export class HttpProbe implements Probe {
  constructor(
    private readonly limiter: RateLimiter,
    private readonly timeoutMs = 10_000,
  ) {}

  async send(req: ProbeRequest): Promise<ProbeResult> {
    await this.limiter.wait();
    try {
      const reqHeaders: Record<string, string> = { accept: '*/*', ...(req.headers ?? {}) };
      if (req.body !== undefined) reqHeaders['content-type'] = 'application/json';

      const res = await fetch(req.url, {
        method: req.method,
        redirect: 'manual',
        headers: reqHeaders,
        ...(req.body !== undefined ? { body: JSON.stringify(req.body) } : {}),
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      const bodyText = await res.text().catch(() => '');
      const headers: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });

      const getSetCookie = (res.headers as { getSetCookie?: () => string[] }).getSetCookie;
      const setCookies = typeof getSetCookie === 'function' ? getSetCookie.call(res.headers) : [];

      return {
        method: req.method,
        url: req.url,
        path: req.path,
        status: res.status,
        headers,
        setCookies,
        bodyText: bodyText.slice(0, MAX_BODY_BYTES),
        secured: req.secured,
      };
    } catch (err) {
      return {
        method: req.method,
        url: req.url,
        path: req.path,
        status: 0,
        headers: {},
        setCookies: [],
        bodyText: '',
        secured: req.secured,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
