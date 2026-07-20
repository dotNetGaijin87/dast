import { SEVERITIES_DESC, type ScanDto } from '@dast/shared';
import { EmptyState } from '../../shared/ui/misc';
import { SeverityLegend } from './SeverityLegend';

function total(s: ScanDto): number {
  if (s.severityCounts) return Object.values(s.severityCounts).reduce((a, b) => a + b, 0);
  return s.findingsCount ?? 0;
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Findings-over-time: one stacked column per completed scan (oldest → newest). */
export function ScanTrends({ scans }: { scans: ScanDto[] }) {
  const completed = scans.filter((s) => s.status === 'completed').reverse();
  if (completed.length === 0) {
    return <EmptyState>No completed scans yet — trends appear once a scan finishes.</EmptyState>;
  }

  const max = Math.max(1, ...completed.map(total));

  return (
    <>
      <SeverityLegend />
      <div className="trends__plot">
        {completed.map((s) => {
          const t = total(s);
          return (
            <div
              key={s.id}
              className="trends__col"
              title={`${new Date(s.createdAt).toLocaleString()} — ${t} finding(s)`}
            >
              <div className="trends__count">{t}</div>
              <div className="trends__bar" style={{ height: `${(t / max) * 100}%` }}>
                {SEVERITIES_DESC.map((sev) => {
                  const c = s.severityCounts?.[sev] ?? 0;
                  if (c === 0) return null;
                  return (
                    <div
                      key={sev}
                      className={`trends__seg trends__seg--${sev}`}
                      style={{ flexGrow: c }}
                      title={`${sev}: ${c}`}
                    />
                  );
                })}
              </div>
              <div className="trends__x">{shortDate(s.createdAt)}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
