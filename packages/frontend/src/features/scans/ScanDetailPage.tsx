import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../shared/ui/PageHeader';
import { Card } from '../../shared/ui/Card';
import { EmptyState, Spinner, ProgressBar } from '../../shared/ui/misc';
import { StatusBadge } from '../../shared/ui/badges';
import { useTarget } from '../targets/api';
import { useScan, useFindings } from './api';
import { useScanEvents } from './useScanEvents';
import { SeveritySummary } from '../dashboard/SeveritySummary';
import { OwaspHeatmap } from '../dashboard/OwaspHeatmap';
import { FindingsTable } from '../findings/FindingsTable';
import { ExportButtons } from '../reports/ExportButtons';

export function ScanDetailPage() {
  const { id = '' } = useParams();
  const { data: scan, isLoading } = useScan(id);
  const targetQuery = useTarget(scan?.targetId ?? '');

  const status = scan?.status ?? null;
  const isActive = status === 'queued' || status === 'running';
  const isCompleted = status === 'completed';
  const live = useScanEvents(id, isActive);
  const findingsQuery = useFindings(id, isCompleted);

  if (isLoading) {
    return (
      <EmptyState>
        <Spinner />
      </EmptyState>
    );
  }
  if (!scan) return <EmptyState>Scan not found.</EmptyState>;

  const progress = Math.max(scan.progress, live.progress);
  const findings = isCompleted ? (findingsQuery.data ?? []) : live.findings;
  const targetName = targetQuery.data?.name ?? 'Target';

  return (
    <>
      <div className="breadcrumb">
        <Link to="/">Targets</Link> / <Link to={`/targets/${scan.targetId}`}>Target</Link> / Scan
      </div>
      <PageHeader
        title="Scan results"
        subtitle={
          <>
            Profile: {scan.profile} · Safe mode: {scan.safeMode ? 'on' : 'off'}
          </>
        }
        actions={
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {isCompleted && findings.length > 0 && (
              <ExportButtons scan={scan} findings={findings} targetName={targetName} />
            )}
            <StatusBadge status={scan.status} />
          </div>
        }
      />

      <div className="stack">
        {scan.status !== 'completed' && (
          <Card title="Progress">
            <ProgressBar value={progress} />
            <div className="muted" style={{ marginTop: 8 }}>
              {progress}%
            </div>
            {live.logs.length > 0 && (
              <div className="console" style={{ marginTop: 12 }}>
                {live.logs.map((line, i) => (
                  <div key={i} className="console__line">
                    {line}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {scan.status === 'failed' && scan.error && (
          <div className="form-error">Scan failed: {scan.error}</div>
        )}

        <Card title="Vulnerabilities by severity">
          <SeveritySummary findings={findings} />
        </Card>

        <Card title="OWASP API Top 10 coverage">
          <OwaspHeatmap findings={findings} />
        </Card>

        <Card title={`Findings (${findings.length})`}>
          <FindingsTable findings={findings} />
        </Card>
      </div>
    </>
  );
}
