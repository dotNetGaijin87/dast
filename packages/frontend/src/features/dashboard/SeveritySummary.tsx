import type { FindingDto, Severity } from '@dast/shared';

const ORDER: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];

export function SeveritySummary({ findings }: { findings: FindingDto[] }) {
  const counts: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const f of findings) counts[f.severity] += 1;

  return (
    <div className="stat-row">
      {ORDER.map((s) => (
        <div key={s} className={`stat stat--${s}`}>
          <div className="stat__value">{counts[s]}</div>
          <div className="stat__label">{s}</div>
        </div>
      ))}
    </div>
  );
}
