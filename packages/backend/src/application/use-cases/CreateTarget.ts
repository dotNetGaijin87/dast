import type { CreateTargetInput } from '@dast/shared';
import type { TargetRepository } from '../ports/TargetRepository';
import type { Target } from '../../domain/entities/Target';
import { defaultScopeFromBaseUrl } from '../../domain/services/ScopePolicy';

export class CreateTarget {
  constructor(private readonly targets: TargetRepository) {}

  async execute(input: CreateTargetInput): Promise<Target> {
    const scopeHosts =
      input.scopeHosts && input.scopeHosts.length > 0
        ? input.scopeHosts
        : defaultScopeFromBaseUrl(input.baseUrl);

    return this.targets.create({
      name: input.name,
      baseUrl: input.baseUrl,
      scopeHosts,
      authProfiles: input.authProfiles ?? [],
    });
  }
}
