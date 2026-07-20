import type { ScanRepository } from '../ports/ScanRepository';
import type { Scan } from '../../domain/entities/Scan';
import { NotFoundError } from '../../domain/errors/DomainError';

export class GetScan {
  constructor(private readonly scans: ScanRepository) {}

  async execute(id: string): Promise<Scan> {
    const scan = await this.scans.findById(id);
    if (!scan) throw new NotFoundError('Scan', id);
    return scan;
  }
}
