import type { HttpMethod } from '@dast/shared';

export interface ParsedEndpoint {
  method: HttpMethod;
  path: string;
  operationId: string | null;
  summary: string | null;
  secured: boolean;
}

export interface ParsedSpec {
  apiTitle: string;
  apiVersion: string;
  endpoints: ParsedEndpoint[];
}

export interface SpecParserInput {
  spec?: string;
  specUrl?: string;
}

export interface SpecParser {
  parse(input: SpecParserInput): Promise<ParsedSpec>;
}
