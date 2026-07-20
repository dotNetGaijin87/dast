import type { ApiEndpoint } from '../../domain/entities/ApiEndpoint';
import type { FindingDraft } from '../../domain/entities/Finding';
import type { EngineName, ScanProfile, AuthProfile } from '@dast/shared';

export interface ScanContext {
  target: { id: string; baseUrl: string; scopeHosts: string[] };
  endpoints: ApiEndpoint[];
  safeMode: boolean;
  /** 'baseline' = passive only; 'full' also runs active/API-logic checks. */
  profile: ScanProfile;
  /** Test identities the engine may act as (for authz checks). */
  identities: AuthProfile[];
  requestsPerSecond: number;
  /** Cap on how many endpoints an engine probes in one scan. */
  maxEndpoints: number;
}

/** How an engine streams progress, logs and findings back to the orchestrator. */
export interface EngineReporter {
  log(message: string): void;
  finding(draft: FindingDraft): void;
  /** Engine-local progress, 0..100. */
  progress(percent: number): void;
}

export interface ScannerEngine {
  readonly name: EngineName;
  run(ctx: ScanContext, report: EngineReporter): Promise<void>;
}
