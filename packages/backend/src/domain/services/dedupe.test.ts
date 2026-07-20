import { describe, it, expect } from 'vitest';
import { dedupeFindings } from './dedupe';
import type { FindingDraft } from '../entities/Finding';

const base: FindingDraft = {
  title: 'Missing header',
  description: '',
  severity: 'low',
  owaspCategory: 'API8:2023',
  engine: 'native',
  method: 'GET',
  path: '/',
};

describe('dedupeFindings', () => {
  it('collapses identical findings on the same location', () => {
    expect(dedupeFindings([base, { ...base }])).toHaveLength(1);
  });

  it('keeps findings that differ by location', () => {
    expect(dedupeFindings([{ ...base, path: '/a' }, { ...base, path: '/b' }])).toHaveLength(2);
  });
});
