import { z } from 'zod';

export const severitySchema = z.enum(['info', 'low', 'medium', 'high', 'critical']);
export type Severity = z.infer<typeof severitySchema>;

/** Numeric rank for sorting / comparing severities (higher = worse). */
export const SEVERITY_ORDER: Record<Severity, number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

/** Severities from worst to least, for consistent stacking/legends. */
export const SEVERITIES_DESC: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];

export type SeverityCounts = Record<Severity, number>;

export function emptySeverityCounts(): SeverityCounts {
  return { info: 0, low: 0, medium: 0, high: 0, critical: 0 };
}

export const severityCountsSchema = z.object({
  info: z.number().int().nonnegative(),
  low: z.number().int().nonnegative(),
  medium: z.number().int().nonnegative(),
  high: z.number().int().nonnegative(),
  critical: z.number().int().nonnegative(),
});

export const scanStatusSchema = z.enum(['queued', 'running', 'completed', 'failed']);
export type ScanStatus = z.infer<typeof scanStatusSchema>;

export const findingStatusSchema = z.enum(['open', 'confirmed', 'false_positive']);
export type FindingStatus = z.infer<typeof findingStatusSchema>;

export const httpMethodSchema = z.enum([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
  'TRACE',
]);
export type HttpMethod = z.infer<typeof httpMethodSchema>;

export const engineNameSchema = z.enum(['native', 'active', 'zap']);
export type EngineName = z.infer<typeof engineNameSchema>;

export const scanProfileSchema = z.enum(['baseline', 'full']);
export type ScanProfile = z.infer<typeof scanProfileSchema>;

/** OWASP API Security Top 10 (2023). The taxonomy findings are mapped to. */
export const owaspApiCategorySchema = z.enum([
  'API1:2023',
  'API2:2023',
  'API3:2023',
  'API4:2023',
  'API5:2023',
  'API6:2023',
  'API7:2023',
  'API8:2023',
  'API9:2023',
  'API10:2023',
]);
export type OwaspApiCategory = z.infer<typeof owaspApiCategorySchema>;

export const OWASP_API_TITLES: Record<OwaspApiCategory, string> = {
  'API1:2023': 'Broken Object Level Authorization',
  'API2:2023': 'Broken Authentication',
  'API3:2023': 'Broken Object Property Level Authorization',
  'API4:2023': 'Unrestricted Resource Consumption',
  'API5:2023': 'Broken Function Level Authorization',
  'API6:2023': 'Unrestricted Access to Sensitive Business Flows',
  'API7:2023': 'Server Side Request Forgery',
  'API8:2023': 'Security Misconfiguration',
  'API9:2023': 'Improper Inventory Management',
  'API10:2023': 'Unsafe Consumption of APIs',
};
