import { z } from 'zod';
import { scanStatusSchema } from './common';
import { findingSchema } from './finding';

/** Real-time events streamed over SSE while a scan runs. */
export const scanEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('status'),
    scanId: z.string(),
    status: scanStatusSchema,
    progress: z.number().int().min(0).max(100),
  }),
  z.object({
    type: z.literal('finding'),
    scanId: z.string(),
    finding: findingSchema,
  }),
  z.object({
    type: z.literal('log'),
    scanId: z.string(),
    message: z.string(),
  }),
]);
export type ScanEvent = z.infer<typeof scanEventSchema>;
