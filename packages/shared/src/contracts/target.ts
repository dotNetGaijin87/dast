import { z } from 'zod';
import { authProfileSchema } from './auth';

export const createTargetSchema = z.object({
  name: z.string().min(1).max(120),
  baseUrl: z.string().url(),
  /** Authorization allow-list. Defaults to the baseUrl host when omitted. */
  scopeHosts: z.array(z.string().min(1)).optional(),
  authProfiles: z.array(authProfileSchema).max(10).optional(),
});
export type CreateTargetInput = z.infer<typeof createTargetSchema>;

export const targetSchema = z.object({
  id: z.string(),
  name: z.string(),
  baseUrl: z.string(),
  scopeHosts: z.array(z.string()),
  /** Names of configured identities. Header values are never exposed. */
  authProfileNames: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  endpointCount: z.number().int().nonnegative().optional(),
});
export type TargetDto = z.infer<typeof targetSchema>;
