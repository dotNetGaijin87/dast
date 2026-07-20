import type { AuthProfile } from '@dast/shared';
import type { TargetRepository } from '../ports/TargetRepository';
import type { Target } from '../../domain/entities/Target';
import { NotFoundError } from '../../domain/errors/DomainError';

export class SetAuthProfiles {
  constructor(private readonly targets: TargetRepository) {}

  async execute(targetId: string, profiles: AuthProfile[]): Promise<Target> {
    const target = await this.targets.findById(targetId);
    if (!target) throw new NotFoundError('Target', targetId);
    return this.targets.setAuthProfiles(targetId, profiles);
  }
}
