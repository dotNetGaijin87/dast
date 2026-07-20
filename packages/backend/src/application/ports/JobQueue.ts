export interface ScanJob {
  scanId: string;
}

export interface JobQueue {
  enqueueScan(job: ScanJob): Promise<void>;
  close(): Promise<void>;
}
