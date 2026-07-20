import type { HttpMethod } from '@dast/shared';

export interface ApiEndpoint {
  id: string;
  targetId: string;
  method: HttpMethod;
  path: string;
  operationId: string | null;
  summary: string | null;
  /** Whether the OpenAPI operation declares a security requirement. */
  secured: boolean;
}
