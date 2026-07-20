import type {
  ScannerEngine,
  ScanContext,
  EngineReporter,
} from '../../application/ports/ScannerEngine';
import { assertInScope } from '../../domain/services/ScopePolicy';
import { buildEndpointUrl, isSafeMethod } from './native/requestBuilder';
import { ZapClient } from './zap/ZapClient';
import { mapZapAlert } from './zap/mapAlert';

export interface ZapEngineConfig {
  baseUrl?: string;
  apiKey?: string;
  /** Overall time budget for passive drain + active scan. */
  timeoutMs?: number;
}

const MAX_FINDINGS = 300;
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * OWASP ZAP adapter. Drives a ZAP daemon over its REST API: seeds the target's
 * endpoints, drains the passive scanner, runs an active scan (only when safe mode
 * is off), then maps ZAP alerts to findings. Runs on the 'full' profile only; if
 * ZAP is unconfigured or unreachable it logs and bows out without failing the scan.
 */
export class ZapEngine implements ScannerEngine {
  readonly name = 'zap' as const;

  constructor(private readonly config: ZapEngineConfig) {}

  async run(ctx: ScanContext, report: EngineReporter): Promise<void> {
    if (!this.config.baseUrl) {
      report.log('ZAP not configured (ZAP_BASE_URL unset); skipping.');
      return;
    }
    if (ctx.profile !== 'full') {
      report.log('ZAP runs on the full profile only; skipping.');
      report.progress(100);
      return;
    }

    const budgetMs = this.config.timeoutMs ?? 300_000;
    const client = new ZapClient({ baseUrl: this.config.baseUrl, apiKey: this.config.apiKey });

    try {
      const version = await client.version();
      report.log(`connected to ZAP ${version}`);
    } catch (err) {
      report.log(`ZAP not reachable (${(err as Error).message}); skipping.`);
      return;
    }

    try {
      assertInScope(ctx.target.scopeHosts, ctx.target.baseUrl);
    } catch {
      report.log('base URL out of authorized scope; skipping ZAP.');
      return;
    }

    const deadline = Date.now() + budgetMs;

    // 1. Seed the sites tree with the base URL + safe endpoints.
    await accessQuietly(client, ctx.target.baseUrl);
    const seeds = ctx.endpoints.filter((e) => isSafeMethod(e.method)).slice(0, ctx.maxEndpoints);
    for (let i = 0; i < seeds.length; i++) {
      const url = buildEndpointUrl(ctx.target.baseUrl, seeds[i]!.path);
      try {
        assertInScope(ctx.target.scopeHosts, url);
      } catch {
        continue;
      }
      await accessQuietly(client, url);
      report.progress(Math.round((i / Math.max(1, seeds.length)) * 20));
    }
    report.log(`seeded ${seeds.length} URL(s) into ZAP`);

    // 2. Drain the passive scanner.
    while (Date.now() < deadline) {
      let remaining: number;
      try {
        remaining = await client.passiveRecordsToScan();
      } catch {
        break;
      }
      if (remaining <= 0) break;
      await sleep(1000);
    }
    report.progress(40);

    // 3. Active scan — only when safe mode is off (it sends attack payloads).
    if (!ctx.safeMode) {
      report.log('starting ZAP active scan');
      let scanId = '';
      try {
        scanId = await client.startActiveScan(ctx.target.baseUrl);
      } catch (err) {
        report.log(`could not start active scan: ${(err as Error).message}`);
      }
      while (scanId !== '' && Date.now() < deadline) {
        let status: number;
        try {
          status = await client.activeScanStatus(scanId);
        } catch {
          break;
        }
        report.progress(40 + Math.round((status / 100) * 55));
        if (status >= 100) break;
        await sleep(2000);
      }
    } else {
      report.log('safe mode: skipping ZAP active scan (passive only)');
    }
    report.progress(95);

    // 4. Collect alerts and map them to findings.
    const alerts = await client.alerts(ctx.target.baseUrl);
    report.log(`ZAP returned ${alerts.length} alert instance(s)`);
    let emitted = 0;
    for (const alert of alerts) {
      if (emitted >= MAX_FINDINGS) break;
      report.finding(mapZapAlert(alert));
      emitted += 1;
    }
    report.progress(100);
  }
}

async function accessQuietly(client: ZapClient, url: string): Promise<void> {
  try {
    await client.accessUrl(url);
  } catch {
    // A single failed access should not abort the whole ZAP run.
  }
}
