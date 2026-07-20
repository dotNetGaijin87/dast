import { describe, it, expect } from 'vitest';
import { buildEndpointUrl, isSafeMethod } from './requestBuilder';

describe('buildEndpointUrl', () => {
  it('substitutes path parameters with a benign placeholder', () => {
    expect(buildEndpointUrl('https://api.example.com', '/users/{id}')).toBe(
      'https://api.example.com/users/1',
    );
  });

  it('preserves a base path and avoids double slashes', () => {
    expect(buildEndpointUrl('https://api.example.com/api/v1/', '/orders/{orderId}/items')).toBe(
      'https://api.example.com/api/v1/orders/1/items',
    );
  });
});

describe('isSafeMethod', () => {
  it('treats read-only methods as safe', () => {
    expect(isSafeMethod('GET')).toBe(true);
    expect(isSafeMethod('HEAD')).toBe(true);
  });
  it('treats mutating methods as unsafe', () => {
    expect(isSafeMethod('POST')).toBe(false);
    expect(isSafeMethod('DELETE')).toBe(false);
  });
});
