import type { ScanContext } from '../../../application/ports/ScannerEngine';
import type { FindingDraft } from '../../../domain/entities/Finding';
import type { Probe } from '../native/types';

export interface ActiveDeps {
  /** Throttled client for normal requests. */
  probe: Probe;
  /** Unthrottled client used only for rate-limit burst testing. */
  burstProbe: Probe;
  ctx: ScanContext;
  log: (message: string) => void;
}

/** An active check performs requests and returns any findings. */
export type ActiveCheck = (deps: ActiveDeps) => Promise<FindingDraft[]>;
