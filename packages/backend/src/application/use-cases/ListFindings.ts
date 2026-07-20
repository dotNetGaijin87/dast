import type { FindingRepository } from '../ports/FindingRepository';
import type { Finding } from '../../domain/entities/Finding';

export class ListFindings {
  constructor(private readonly findings: FindingRepository) {}

  async execute(scanId: string): Promise<Finding[]> {
    return this.findings.listForScan(scanId);
  }
}
