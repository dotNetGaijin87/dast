import type { TargetRepository } from '../ports/TargetRepository';
import type { Target } from '../../domain/entities/Target';
import { NotFoundError } from '../../domain/errors/DomainError';

export class GetTarget {
  constructor(private readonly targets: TargetRepository) {}

  async execute(id: string): Promise<Target> {
    const target = await this.targets.findById(id);
    if (!target) throw new NotFoundError('Target', id);
    return target;
  }
}
