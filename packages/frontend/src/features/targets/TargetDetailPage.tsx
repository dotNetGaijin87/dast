import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../shared/ui/PageHeader';
import { Card } from '../../shared/ui/Card';
import { EmptyState, Spinner } from '../../shared/ui/misc';
import { useTarget, useEndpoints } from './api';
import { useScans } from '../scans/api';
import { IdentitiesForm } from './components/IdentitiesForm';
import { SpecImportForm } from '../spec-import/SpecImportForm';
import { EndpointsTable } from '../spec-import/EndpointsTable';
import { ScanList } from '../scans/components/ScanList';
import { StartScanForm } from '../scans/components/StartScanForm';
import { ScanTrends } from '../dashboard/ScanTrends';

export function TargetDetailPage() {
  const { id = '' } = useParams();
  const { data: target, isLoading } = useTarget(id);
  const { data: endpoints } = useEndpoints(id);
  const { data: scans } = useScans(id);
  const endpointCount = endpoints?.length ?? 0;

  if (isLoading) {
    return (
      <EmptyState>
        <Spinner />
      </EmptyState>
    );
  }
  if (!target) return <EmptyState>Target not found.</EmptyState>;

  return (
    <>
      <div className="breadcrumb">
        <Link to="/">Targets</Link> / {target.name}
      </div>
      <PageHeader title={target.name} subtitle={<span className="mono">{target.baseUrl}</span>} />

      <div className="stack">
        <div className="grid-2">
          <Card title="Import OpenAPI specification">
            <SpecImportForm targetId={id} />
          </Card>
          <Card title="Test identities">
            <IdentitiesForm target={target} />
          </Card>
        </div>
        <Card title={`Endpoints (${endpointCount})`}>
          <EndpointsTable endpoints={endpoints ?? []} />
        </Card>
        <Card title="Scan trends">
          <ScanTrends scans={scans ?? []} />
        </Card>
        <Card title="Scans">
          <StartScanForm targetId={id} disabled={endpointCount === 0} />
          <ScanList targetId={id} />
        </Card>
      </div>
    </>
  );
}
