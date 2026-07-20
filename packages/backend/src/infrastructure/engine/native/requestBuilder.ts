import type { HttpMethod } from '@dast/shared';

/** Methods that are safe to send in safe mode (read-only, non-mutating). */
export const SAFE_METHODS: HttpMethod[] = ['GET', 'HEAD', 'OPTIONS'];

export function isSafeMethod(method: HttpMethod): boolean {
  return SAFE_METHODS.includes(method);
}

/**
 * Build a concrete URL from a base URL and an OpenAPI path template, substituting
 * a benign placeholder for path parameters. Preserves any base path on baseUrl.
 */
export function buildEndpointUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/+$/, '');
  const concrete = path.replace(/\{[^}]+\}/g, '1');
  const suffix = concrete.startsWith('/') ? concrete : `/${concrete}`;
  return `${base}${suffix}`;
}
