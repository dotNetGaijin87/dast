import type { ScanRepository } from '../ports/ScanRepository';
import type { TargetRepository } from '../ports/TargetRepository';
import type { ApiEndpointRepository } from '../ports/ApiEndpointRepository';
import type { FindingRepository } from '../ports/FindingRepository';
import type { EventPublisher } from '../ports/EventBus';
import type { ScannerEngine, EngineReporter, ScanContext } from '../ports/ScannerEngine';
import type { Logger } from '../ports/Logger';
import type { FindingDraft } from '../../domain/entities/Finding';
import { dedupeFindings } from '../../domain/services/dedupe';
import { NotFoundError } from '../../domain/errors/DomainError';
import { toFindingDto } from '../mappers/toDto';
import type { ScanProfile } from '@dast/shared';

export interface RunScanConfig {
  requestsPerSecond: number;
  maxEndpoints: number;
}

/**
 * Orchestrates a single scan: runs every engine over the target, streams
 * progress/findings as SSE events, then persists deduped findings. Executed by
 * the worker process.
 */
export class RunScan {
  constructor(
    private readonly scans: ScanRepository,
    private readonly targets: TargetRepository,
    private readonly endpoints: ApiEndpointRepository,
    private readonly findings: FindingRepository,
    private readonly engines: ScannerEngine[],
    private readonly events: EventPublisher,
    private readonly logger: Logger,
    private readonly config: RunScanConfig,
  ) {}

  async execute(scanId: string): Promise<void> {
    const scan = await this.scans.findById(scanId);
    if (!scan) throw new NotFoundError('Scan', scanId);
    const target = await this.targets.findById(scan.targetId);
    if (!target) throw new NotFoundError('Target', scan.targetId);

    await this.scans.update(scanId, { status: 'running', progress: 0, startedAt: new Date() });
    await this.events.publish({ type: 'status', scanId, status: 'running', progress: 0 });

    try {
      const endpoints = await this.endpoints.listForTarget(target.id);
      const ctx: ScanContext = {
        target: { id: target.id, baseUrl: target.baseUrl, scopeHosts: target.scopeHosts },
        endpoints,
        safeMode: scan.safeMode,
        profile: (scan.profile === 'full' ? 'full' : 'baseline') satisfies ScanProfile,
        identities: target.authProfiles,
        requestsPerSecond: this.config.requestsPerSecond,
        maxEndpoints: this.config.maxEndpoints,
      };

      const drafts: FindingDraft[] = [];
      const total = this.engines.length || 1;

      for (let i = 0; i < this.engines.length; i++) {
        const engine = this.engines[i]!;
        const base = Math.round((i / total) * 100);
        const span = Math.round(100 / total);
        const reporter: EngineReporter = {
          log: (message) => {
            void this.events.publish({ type: 'log', scanId, message: `[${engine.name}] ${message}` });
          },
          finding: (draft) => {
            drafts.push(draft);
          },
          progress: (pct) => {
            const overall = Math.min(99, base + Math.round((Math.max(0, Math.min(100, pct)) / 100) * span));
            void this.scans.update(scanId, { progress: overall });
            void this.events.publish({ type: 'status', scanId, status: 'running', progress: overall });
          },
        };

        try {
          await engine.run(ctx, reporter);
        } catch (err) {
          this.logger.error({ err, engine: engine.name, scanId }, 'engine failed');
          reporter.log(`engine error: ${(err as Error).message}`);
        }
      }

      const saved = await this.findings.addMany(scanId, dedupeFindings(drafts));
      for (const finding of saved) {
        await this.events.publish({ type: 'finding', scanId, finding: toFindingDto(finding) });
      }

      await this.scans.update(scanId, {
        status: 'completed',
        progress: 100,
        finishedAt: new Date(),
      });
      await this.events.publish({ type: 'status', scanId, status: 'completed', progress: 100 });
      this.logger.info({ scanId, findings: saved.length }, 'scan completed');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.scans.update(scanId, { status: 'failed', error: message, finishedAt: new Date() });
      await this.events.publish({ type: 'status', scanId, status: 'failed', progress: scan.progress });
      this.logger.error({ err, scanId }, 'scan failed');
      throw err;
    }
  }
}
