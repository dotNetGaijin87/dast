import { z } from 'zod';
import { httpMethodSchema } from './common';

export const apiEndpointSchema = z.object({
  id: z.string(),
  method: httpMethodSchema,
  path: z.string(),
  operationId: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  secured: z.boolean(),
});
export type ApiEndpointDto = z.infer<typeof apiEndpointSchema>;
