import type { TargetRepository, TargetWithCounts } from '../ports/TargetRepository';

export class ListTargets {
  constructor(private readonly targets: TargetRepository) {}

  async execute(): Promise<TargetWithCounts[]> {
    return this.targets.list();
  }
}
