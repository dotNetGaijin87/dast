import type { ApiEndpoint } from '../../domain/entities/ApiEndpoint';
import type { HttpMethod } from '@dast/shared';

export interface NewEndpoint {
  method: HttpMethod;
  path: string;
  operationId: string | null;
  summary: string | null;
  secured: boolean;
}

export interface ApiEndpointRepository {
  /** Replace the full endpoint set for a target (idempotent re-import). */
  replaceForTarget(targetId: string, endpoints: NewEndpoint[]): Promise<ApiEndpoint[]>;
  listForTarget(targetId: string): Promise<ApiEndpoint[]>;
}
