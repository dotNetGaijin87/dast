import type { Finding, FindingDraft } from '../../domain/entities/Finding';

export interface FindingRepository {
  addMany(scanId: string, drafts: FindingDraft[]): Promise<Finding[]>;
  listForScan(scanId: string): Promise<Finding[]>;
}
