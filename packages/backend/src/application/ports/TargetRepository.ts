import type { Target } from '../../domain/entities/Target';
import type { AuthProfile } from '@dast/shared';

export interface CreateTargetData {
  name: string;
  baseUrl: string;
  scopeHosts: string[];
  authProfiles: AuthProfile[];
}

export type TargetWithCounts = Target & { endpointCount: number };

export interface TargetRepository {
  create(data: CreateTargetData): Promise<Target>;
  findById(id: string): Promise<Target | null>;
  list(): Promise<TargetWithCounts[]>;
  setAuthProfiles(id: string, profiles: AuthProfile[]): Promise<Target>;
}
