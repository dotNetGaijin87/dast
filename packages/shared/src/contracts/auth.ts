import { z } from 'zod';

/**
 * A test identity the scanner can act as (e.g. two users for BOLA testing).
 * `headers` are attached verbatim to requests — typically an Authorization
 * header. Treated as sensitive: values are never returned to the client.
 */
export const authProfileSchema = z.object({
  name: z.string().min(1).max(60),
  headers: z.record(z.string(), z.string()),
});
export type AuthProfile = z.infer<typeof authProfileSchema>;

export const setAuthProfilesSchema = z.object({
  authProfiles: z.array(authProfileSchema).max(10),
});
export type SetAuthProfilesInput = z.infer<typeof setAuthProfilesSchema>;
