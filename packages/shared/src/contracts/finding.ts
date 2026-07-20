import { z } from 'zod';
import {
  severitySchema,
  findingStatusSchema,
  owaspApiCategorySchema,
  engineNameSchema,
  httpMethodSchema,
} from './common';

export const findingSchema = z.object({
  id: z.string(),
  scanId: z.string(),
  title: z.string(),
  description: z.string(),
  severity: severitySchema,
  owaspCategory: owaspApiCategorySchema,
  engine: engineNameSchema,
  method: httpMethodSchema.nullable().optional(),
  path: z.string().nullable().optional(),
  evidence: z.record(z.unknown()).nullable().optional(),
  remediation: z.string().nullable().optional(),
  status: findingStatusSchema,
  createdAt: z.string(),
});
export type FindingDto = z.infer<typeof findingSchema>;
