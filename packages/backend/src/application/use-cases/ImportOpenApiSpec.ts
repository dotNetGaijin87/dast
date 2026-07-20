import type { ImportSpecInput, ImportSpecResult } from '@dast/shared';
import type { TargetRepository } from '../ports/TargetRepository';
import type { ApiEndpointRepository } from '../ports/ApiEndpointRepository';
import type { SpecParser } from '../ports/SpecParser';
import { NotFoundError } from '../../domain/errors/DomainError';
import { toApiEndpointDto } from '../mappers/toDto';

export class ImportOpenApiSpec {
  constructor(
    private readonly targets: TargetRepository,
    private readonly endpoints: ApiEndpointRepository,
    private readonly parser: SpecParser,
  ) {}

  async execute(targetId: string, input: ImportSpecInput): Promise<ImportSpecResult> {
    const target = await this.targets.findById(targetId);
    if (!target) throw new NotFoundError('Target', targetId);

    const parsed = await this.parser.parse(input);
    const saved = await this.endpoints.replaceForTarget(targetId, parsed.endpoints);

    return {
      targetId,
      apiTitle: parsed.apiTitle,
      apiVersion: parsed.apiVersion,
      endpoints: saved.map(toApiEndpointDto),
    };
  }
}
