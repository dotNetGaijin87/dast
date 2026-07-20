import type { ApiEndpointRepository } from '../ports/ApiEndpointRepository';
import type { ApiEndpoint } from '../../domain/entities/ApiEndpoint';

export class ListEndpoints {
  constructor(private readonly endpoints: ApiEndpointRepository) {}

  async execute(targetId: string): Promise<ApiEndpoint[]> {
    return this.endpoints.listForTarget(targetId);
  }
}
