import type { StartScanInput } from '@dast/shared';
import type { TargetRepository } from '../ports/TargetRepository';
import type { ScanRepository } from '../ports/ScanRepository';
import type { ApiEndpointRepository } from '../ports/ApiEndpointRepository';
import type { JobQueue } from '../ports/JobQueue';
import type { Scan } from '../../domain/entities/Scan';
import { NotFoundError, ValidationError } from '../../domain/errors/DomainError';

export class StartScan {
  constructor(
    private readonly targets: TargetRepository,
    private readonly scans: ScanRepository,
    private readonly endpoints: ApiEndpointRepository,
    private readonly queue: JobQueue,
  ) {}

  async execute(targetId: string, input: StartScanInput): Promise<Scan> {
    const target = await this.targets.findById(targetId);
    if (!target) throw new NotFoundError('Target', targetId);

    const endpoints = await this.endpoints.listForTarget(targetId);
    if (endpoints.length === 0) {
      throw new ValidationError('Import an OpenAPI spec before scanning this target.');
    }

    const scan = await this.scans.create({
      targetId,
      profile: input.profile,
      safeMode: input.safeMode,
    });
    await this.queue.enqueueScan({ scanId: scan.id });
    return scan;
  }
}
