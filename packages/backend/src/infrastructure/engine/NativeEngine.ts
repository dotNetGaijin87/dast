import type {
  ScannerEngine,
  ScanContext,
  EngineReporter,
} from '../../application/ports/ScannerEngine';
import type { ApiEndpoint } from '../../domain/entities/ApiEndpoint';
import { assertInScope } from '../../domain/services/ScopePolicy';
import { RateLimiter } from './native/RateLimiter';
import { HttpProbe } from './native/HttpProbe';
import { buildEndpointUrl, isSafeMethod } from './native/requestBuilder';
import { SERVER_CHECKS, ENDPOINT_CHECKS } from './native/checks';
import type { ProbeResult, PassiveCheck } from './native/types';

/**
 * Native TypeScript engine — passive checks. Probes the target with throttled,
 * scope-checked, non-destructive requests and analyzes responses. In safe mode
 * only read-only methods (GET/HEAD/OPTIONS) are sent. Spec-aware active checks
 * (BOLA/IDOR, function-level authz, mass assignment) live in ActiveEngine.
 */
export class NativeEngine implements ScannerEngine {
  readonly name = 'native' as const;

  async run(ctx: ScanContext, report: EngineReporter): Promise<void> {
    const probe = new HttpProbe(new RateLimiter(ctx.requestsPerSecond));

    report.log('probing base URL for server-wide checks');
    try {
      assertInScope(ctx.target.scopeHosts, ctx.target.baseUrl);
    } catch (err) {
      report.log(`base URL is out of authorized scope; aborting: ${(err as Error).message}`);
      return;
    }

    const baseResult = await probe.send({
      method: 'GET',
      url: ctx.target.baseUrl,
      path: safePath(ctx.target.baseUrl),
      secured: false,
    });
    emitFindings(baseResult, SERVER_CHECKS, report);
    report.progress(10);

    const candidates = this.selectEndpoints(ctx, report);
    if (candidates.length === 0) {
      report.log('no probeable endpoints; passive scan complete');
      report.progress(100);
      return;
    }

    report.log(`probing ${candidates.length} endpoint(s)`);
    for (let i = 0; i < candidates.length; i++) {
      const endpoint = candidates[i]!;
      const url = buildEndpointUrl(ctx.target.baseUrl, endpoint.path);
      try {
        assertInScope(ctx.target.scopeHosts, url);
      } catch {
        continue; // never touch a host outside scope
      }

      const result = await probe.send({
        method: endpoint.method,
        url,
        path: endpoint.path,
        secured: endpoint.secured,
      });
      emitFindings(result, ENDPOINT_CHECKS, report);

      report.progress(10 + Math.round(((i + 1) / candidates.length) * 90));
    }

    report.log('passive scan complete');
    report.progress(100);
  }

  private selectEndpoints(ctx: ScanContext, report: EngineReporter): ApiEndpoint[] {
    const probeable = ctx.endpoints.filter((e) => !ctx.safeMode || isSafeMethod(e.method));
    const skipped = ctx.endpoints.length - probeable.length;
    if (skipped > 0) {
      report.log(`safe mode: skipping ${skipped} endpoint(s) with mutating methods`);
    }
    return probeable.slice(0, ctx.maxEndpoints);
  }
}

function emitFindings(result: ProbeResult, checks: PassiveCheck[], report: EngineReporter): void {
  for (const check of checks) {
    for (const draft of check(result)) report.finding(draft);
  }
}

function safePath(url: string): string {
  try {
    return new URL(url).pathname || '/';
  } catch {
    return '/';
  }
}
