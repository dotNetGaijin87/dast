import type { AuthProfile } from '@dast/shared';

export interface Target {
  id: string;
  name: string;
  baseUrl: string;
  /** Authorization allow-list of hostnames this target may be scanned against. */
  scopeHosts: string[];
  /** Test identities used by active authorization checks (headers are sensitive). */
  authProfiles: AuthProfile[];
  createdAt: Date;
  updatedAt: Date;
}
