import { AuthorizationScopeError } from '../errors/DomainError';

/** Extract a hostname (host:port) from a URL string, or null if unparseable. */
export function hostOf(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

/**
 * Core authorization guardrail: a target may only be scanned against hosts on
 * its allow-list. Every outbound scan request must pass through here.
 */
export function assertInScope(scopeHosts: string[], url: string): void {
  const host = hostOf(url);
  if (host === null || !scopeHosts.includes(host)) {
    throw new AuthorizationScopeError(host ?? url);
  }
}

export function defaultScopeFromBaseUrl(baseUrl: string): string[] {
  const host = hostOf(baseUrl);
  return host ? [host] : [];
}
