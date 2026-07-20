import type { FindingDraft } from '../entities/Finding';

/** Collapse duplicate findings that describe the same issue on the same location. */
export function dedupeFindings(drafts: FindingDraft[]): FindingDraft[] {
  const seen = new Set<string>();
  const out: FindingDraft[] = [];
  for (const d of drafts) {
    const key = `${d.engine}|${d.owaspCategory}|${d.title}|${d.method ?? ''}|${d.path ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(d);
  }
  return out;
}
