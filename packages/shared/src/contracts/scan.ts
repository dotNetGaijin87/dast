import { z } from 'zod';
import { scanStatusSchema, severityCountsSchema } from './common';

export const startScanSchema = z.object({
  profile: z.enum(['baseline', 'full']).default('baseline'),
  safeMode: z.boolean().default(true),
});
export type StartScanInput = z.infer<typeof startScanSchema>;

export const scanSchema = z.object({
  id: z.string(),
  targetId: z.string(),
  status: scanStatusSchema,
  profile: z.string(),
  progress: z.number().int().min(0).max(100),
  safeMode: z.boolean(),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
  error: z.string().nullable(),
  createdAt: z.string(),
  findingsCount: z.number().int().nonnegative().optional(),
  severityCounts: severityCountsSchema.optional(),
});
export type ScanDto = z.infer<typeof scanSchema>;
