import { SEVERITIES_DESC } from '@dast/shared';

export function SeverityLegend() {
  return (
    <div className="chart-legend">
      {SEVERITIES_DESC.map((s) => (
        <span key={s} className="legend-item">
          <span className={`legend-swatch legend-swatch--${s}`} />
          {s}
        </span>
      ))}
    </div>
  );
}
