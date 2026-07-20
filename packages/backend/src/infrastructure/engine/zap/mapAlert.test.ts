import { describe, it, expect } from 'vitest';
import { mapZapRisk, mapZapCategory, mapZapAlert } from './mapAlert';

describe('mapZapRisk', () => {
  it('maps ZAP risk levels to severities', () => {
    expect(mapZapRisk('High')).toBe('high');
    expect(mapZapRisk('Medium')).toBe('medium');
    expect(mapZapRisk('Low')).toBe('low');
    expect(mapZapRisk('Informational')).toBe('info');
    expect(mapZapRisk('anything else')).toBe('info');
  });
});

describe('mapZapCategory', () => {
  it('routes SSRF and auth, and defaults to misconfiguration', () => {
    expect(mapZapCategory('Server Side Request Forgery')).toBe('API7:2023');
    expect(mapZapCategory('Session Fixation')).toBe('API2:2023');
    expect(mapZapCategory('X-Frame-Options Header Not Set')).toBe('API8:2023');
  });
});

describe('mapZapAlert', () => {
  it('maps a complete alert to a finding draft', () => {
    const f = mapZapAlert({
      alert: 'SQL Injection',
      risk: 'High',
      description: 'desc',
      url: 'https://api.test/x?q=1',
      param: 'q',
      evidence: "' OR 1=1",
      solution: 'Use parameterized queries',
      method: 'get',
      cweid: '89',
      confidence: 'High',
    });
    expect(f.engine).toBe('zap');
    expect(f.severity).toBe('high');
    expect(f.title).toBe('SQL Injection');
    expect(f.method).toBe('GET');
    expect(f.path).toBe('/x');
    expect(f.remediation).toBe('Use parameterized queries');
  });

  it('falls back to name and null method/path when fields are absent', () => {
    const f = mapZapAlert({ name: 'Some Alert', risk: 'Low' });
    expect(f.title).toBe('Some Alert');
    expect(f.method).toBeNull();
    expect(f.path).toBeNull();
    expect(f.remediation).toBeUndefined();
  });
});
