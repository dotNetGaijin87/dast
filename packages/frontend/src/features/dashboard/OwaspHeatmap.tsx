import {
  OWASP_API_TITLES,
  SEVERITY_ORDER,
  type FindingDto,
  type OwaspApiCategory,
  type Severity,
} from '@dast/shared';
import { SeverityLegend } from './SeverityLegend';

const CATEGORIES = Object.keys(OWASP_API_TITLES) as OwaspApiCategory[];

interface Cell {
  count: number;
  worst: Severity | null;
}

/** OWASP API Top-10 grid; each category cell is colored by its worst severity. */
export function OwaspHeatmap({ findings }: { findings: FindingDto[] }) {
  const cells = new Map<OwaspApiCategory, Cell>();
  for (const cat of CATEGORIES) cells.set(cat, { count: 0, worst: null });
  for (const f of findings) {
    const cell = cells.get(f.owaspCategory);
    if (!cell) continue;
    cell.count += 1;
    if (cell.worst === null || SEVERITY_ORDER[f.severity] > SEVERITY_ORDER[cell.worst]) {
      cell.worst = f.severity;
    }
  }

  return (
    <>
      <SeverityLegend />
      <div className="heatmap">
        {CATEGORIES.map((cat) => {
          const cell = cells.get(cat)!;
          const active = cell.count > 0 && cell.worst !== null;
          const cls = active ? `heat-cell heat-cell--${cell.worst}` : 'heat-cell heat-cell--empty';
          return (
            <div key={cat} className={cls} title={OWASP_API_TITLES[cat]}>
              <div className="heat-cell__top">
                <span className="heat-cell__code">{cat.replace(':2023', '')}</span>
                <span className="heat-cell__count">{cell.count}</span>
              </div>
              <div className="heat-cell__title">{OWASP_API_TITLES[cat]}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
