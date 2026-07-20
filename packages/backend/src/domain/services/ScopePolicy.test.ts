import { describe, it, expect } from 'vitest';
import { assertInScope, defaultScopeFromBaseUrl, hostOf } from './ScopePolicy';
import { AuthorizationScopeError } from '../errors/DomainError';

describe('ScopePolicy', () => {
  it('allows a URL whose host is in scope', () => {
    expect(() => assertInScope(['api.example.com'], 'https://api.example.com/v1')).not.toThrow();
  });

  it('rejects a URL whose host is not in scope', () => {
    expect(() => assertInScope(['api.example.com'], 'https://evil.example.net/x')).toThrow(
      AuthorizationScopeError,
    );
  });

  it('derives the default scope (host:port) from the base URL', () => {
    expect(defaultScopeFromBaseUrl('https://api.example.com:8443/v1')).toEqual([
      'api.example.com:8443',
    ]);
  });

  it('returns null host for an unparseable URL', () => {
    expect(hostOf('not a url')).toBeNull();
  });
});
