import { z } from 'zod';
import { apiEndpointSchema } from './endpoint';

/** Import an OpenAPI spec for a target: provide exactly one of raw text or URL. */
export const importSpecSchema = z
  .object({
    spec: z.string().min(1).optional(),
    specUrl: z.string().url().optional(),
  })
  .refine((v) => Boolean(v.spec) !== Boolean(v.specUrl), {
    message: 'Provide exactly one of "spec" or "specUrl".',
  });
export type ImportSpecInput = z.infer<typeof importSpecSchema>;

export const importSpecResultSchema = z.object({
  targetId: z.string(),
  apiTitle: z.string(),
  apiVersion: z.string(),
  endpoints: z.array(apiEndpointSchema),
});
export type ImportSpecResult = z.infer<typeof importSpecResultSchema>;
