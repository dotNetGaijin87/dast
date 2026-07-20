import type {
  ScannerEngine,
  ScanContext,
  EngineReporter,
} from '../../application/ports/ScannerEngine';
import { HttpProbe } from './native/HttpProbe';
import { RateLimiter } from './native/RateLimiter';
import { ACTIVE_CHECKS } from './active/checks';
import type { ActiveDeps } from './active/types';

/**
 * Native active / API-logic engine. Runs only for the 'full' profile. Performs
 * spec-aware checks that need to send crafted requests (rate limiting,
 * function-level authz, BOLA across identities, mass assignment). All requests
 * are scope-checked; mutating checks require safe mode to be off.
 */
export class ActiveEngine implements ScannerEngine {
  readonly name = 'active' as const;

  async run(ctx: ScanContext, report: EngineReporter): Promise<void> {
    if (ctx.profile !== 'full') {
      report.log('active checks skipped (baseline profile)');
      report.progress(100);
      return;
    }

    const deps: ActiveDeps = {
      probe: new HttpProbe(new RateLimiter(ctx.requestsPerSecond)),
      burstProbe: new HttpProbe(new RateLimiter(0)),
      ctx,
      log: (message) => report.log(message),
    };

    for (let i = 0; i < ACTIVE_CHECKS.length; i++) {
      try {
        const drafts = await ACTIVE_CHECKS[i]!(deps);
        for (const draft of drafts) report.finding(draft);
      } catch (err) {
        report.log(`active check error: ${(err as Error).message}`);
      }
      report.progress(Math.round(((i + 1) / ACTIVE_CHECKS.length) * 100));
    }

    report.log('active checks complete');
  }
}
