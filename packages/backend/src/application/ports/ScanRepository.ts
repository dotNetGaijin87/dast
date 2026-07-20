import type { Scan } from '../../domain/entities/Scan';
import type { SeverityCounts } from '@dast/shared';

export interface CreateScanData {
  targetId: string;
  profile: string;
  safeMode: boolean;
}

export type ScanPatch = Partial<
  Pick<Scan, 'status' | 'progress' | 'startedAt' | 'finishedAt' | 'error'>
>;

export type ScanWithCounts = Scan & {
  findingsCount: number;
  severityCounts: SeverityCounts;
};

export interface ScanRepository {
  create(data: CreateScanData): Promise<Scan>;
  findById(id: string): Promise<Scan | null>;
  listForTarget(targetId: string): Promise<ScanWithCounts[]>;
  update(id: string, patch: ScanPatch): Promise<Scan>;
}
