import type {
  Severity,
  OwaspApiCategory,
  EngineName,
  HttpMethod,
  FindingStatus,
} from '@dast/shared';

export interface Finding {
  id: string;
  scanId: string;
  title: string;
  description: string;
  severity: Severity;
  owaspCategory: OwaspApiCategory;
  engine: EngineName;
  method: HttpMethod | null;
  path: string | null;
  evidence: Record<string, unknown> | null;
  remediation: string | null;
  status: FindingStatus;
  createdAt: Date;
}

/** A finding as produced by an engine, before it is persisted. */
export interface FindingDraft {
  title: string;
  description: string;
  severity: Severity;
  owaspCategory: OwaspApiCategory;
  engine: EngineName;
  method?: HttpMethod | null;
  path?: string | null;
  evidence?: Record<string, unknown> | null;
  remediation?: string | null;
}
