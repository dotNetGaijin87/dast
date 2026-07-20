import type { ScanStatus } from '@dast/shared';

export interface Scan {
  id: string;
  targetId: string;
  status: ScanStatus;
  profile: string;
  progress: number;
  safeMode: boolean;
  startedAt: Date | null;
  finishedAt: Date | null;
  error: string | null;
  createdAt: Date;
}
