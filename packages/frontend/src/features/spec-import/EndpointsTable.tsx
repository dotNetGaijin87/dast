import type { ApiEndpointDto } from '@dast/shared';
import { MethodPill } from '../../shared/ui/badges';
import { EmptyState } from '../../shared/ui/misc';

export function EndpointsTable({ endpoints }: { endpoints: ApiEndpointDto[] }) {
  if (endpoints.length === 0) {
    return <EmptyState>No endpoints yet. Import an OpenAPI spec above.</EmptyState>;
  }

  return (
    <div className="table__scroll">
      <table className="table">
        <thead>
          <tr>
            <th>Method</th>
            <th>Path</th>
            <th>Summary</th>
            <th>Auth</th>
          </tr>
        </thead>
        <tbody>
          {endpoints.map((e) => (
            <tr key={e.id}>
              <td>
                <MethodPill method={e.method} />
              </td>
              <td className="mono">{e.path}</td>
              <td className="text-secondary">{e.summary ?? e.operationId ?? '—'}</td>
              <td className="muted">{e.secured ? 'required' : 'none'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
