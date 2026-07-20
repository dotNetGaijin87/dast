import type { HttpMethod } from '@dast/shared';
import type { FindingDraft } from '../../../domain/entities/Finding';

export interface ProbeRequest {
  method: HttpMethod;
  url: string;
  /** The spec path (template) this request came from, for reporting. */
  path: string;
  /** Whether the source endpoint declared a security requirement. */
  secured: boolean;
  /** Extra headers (e.g. an identity's Authorization header). */
  headers?: Record<string, string>;
  /** Optional JSON request body (active checks only). */
  body?: unknown;
}

export interface ProbeResult {
  method: HttpMethod;
  url: string;
  path: string;
  status: number;
  /** Response headers, keys lowercased. */
  headers: Record<string, string>;
  setCookies: string[];
  bodyText: string;
  secured: boolean;
  /** Set when the request could not be completed (network/timeout). */
  error?: string;
}

/** A passive check: pure analysis of one probe result into zero or more findings. */
export type PassiveCheck = (result: ProbeResult) => FindingDraft[];

/** The client interface active checks depend on (implemented by HttpProbe). */
export interface Probe {
  send(req: ProbeRequest): Promise<ProbeResult>;
}

export function reached(result: ProbeResult): boolean {
  return result.error === undefined && result.status > 0;
}
