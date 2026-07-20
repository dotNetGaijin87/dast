import type { ScanRepository, ScanWithCounts } from '../ports/ScanRepository';

export class ListScans {
  constructor(private readonly scans: ScanRepository) {}

  async execute(targetId: string): Promise<ScanWithCounts[]> {
    return this.scans.listForTarget(targetId);
  }
}
