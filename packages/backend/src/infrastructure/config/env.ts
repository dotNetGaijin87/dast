import { z } from 'zod';

/** Parse "true"/"1" as true, anything else falsey; keeps SAFE_MODE fail-safe. */
const boolFromEnv = z.preprocess((v) => {
  if (typeof v === 'string') return v.toLowerCase() === 'true' || v === '1';
  return v;
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
  ZAP_BASE_URL: z.string().url().optional(),
  ZAP_API_KEY: z.string().optional(),
  ZAP_TIMEOUT_MS: z.coerce.number().int().positive().default(300_000),
  SAFE_MODE: boolFromEnv.default(true),
  SCAN_MAX_CONCURRENCY: z.coerce.number().int().positive().default(2),
  SCAN_REQUESTS_PER_SECOND: z.coerce.number().int().positive().default(10),
  SCAN_MAX_ENDPOINTS: z.coerce.number().int().positive().default(50),
  CORS_ORIGIN: z.string().default('*'),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}
