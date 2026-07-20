import { describe, it, expect } from 'vitest';
import { SEVERITY_ORDER, OWASP_API_TITLES, severitySchema } from './common';

describe('severity vocabulary', () => {
  it('ranks critical above info', () => {
    expect(SEVERITY_ORDER.critical).toBeGreaterThan(SEVERITY_ORDER.info);
  });

  it('accepts valid severities and rejects invalid ones', () => {
    expect(severitySchema.safeParse('high').success).toBe(true);
    expect(severitySchema.safeParse('nope').success).toBe(false);
  });

  it('has a title for all ten OWASP API categories', () => {
    expect(Object.keys(OWASP_API_TITLES)).toHaveLength(10);
  });
});
