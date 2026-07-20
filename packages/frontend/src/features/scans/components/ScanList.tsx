import { Link } from 'react-router-dom';
import { useScans } from '../api';
import { StatusBadge } from '../../../shared/ui/badges';
import { EmptyState, Spinner, ProgressBar } from '../../../shared/ui/misc';

export function ScanList({ targetId }: { targetId: string }) {
  const { data: scans, isLoading } = useScans(targetId);

  if (isLoading) {
    return (
      <EmptyState>
        <Spinner />
      </EmptyState>
    );
  }
  if (!scans || scans.length === 0) {
    return <EmptyState>No scans yet. Start one from the button above.</EmptyState>;
  }

  return (
    <div className="table__scroll">
      <table className="table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Progress</th>
            <th>Findings</th>
            <th>Started</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {scans.map((s) => (
            <tr key={s.id}>
              <td>
                <StatusBadge status={s.status} />
              </td>
              <td style={{ minWidth: 140 }}>
                <ProgressBar value={s.progress} />
              </td>
              <td>{s.findingsCount ?? 0}</td>
              <td className="muted">
                {s.startedAt ? new Date(s.startedAt).toLocaleString() : '—'}
              </td>
              <td>
                <Link to={`/scans/${s.id}`}>View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
