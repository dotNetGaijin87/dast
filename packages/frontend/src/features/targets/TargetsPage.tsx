import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../shared/ui/PageHeader';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import { EmptyState, Spinner } from '../../shared/ui/misc';
import { useTargets } from './api';
import { CreateTargetForm } from './components/CreateTargetForm';

export function TargetsPage() {
  const [showForm, setShowForm] = useState(false);
  const { data: targets, isLoading } = useTargets();

  return (
    <>
      <PageHeader
        title="Targets"
        subtitle="Applications authorized for dynamic security testing."
        actions={
          <Button variant={showForm ? 'secondary' : 'primary'} onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Close' : 'New target'}
          </Button>
        }
      />

      <div className="stack">
        <div className="callout">
          <span>🔒</span>
          <span>
            Only add applications you are authorized to test. Scans are restricted to each target&apos;s
            scope allow-list and run in safe mode by default.
          </span>
        </div>

        {showForm && (
          <Card title="New target">
            <CreateTargetForm onCreated={() => setShowForm(false)} />
          </Card>
        )}

        <Card title="All targets">
          {isLoading ? (
            <EmptyState>
              <Spinner />
            </EmptyState>
          ) : !targets || targets.length === 0 ? (
            <EmptyState>No targets yet. Create one to get started.</EmptyState>
          ) : (
            <div className="table__scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Base URL</th>
                    <th>Endpoints</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {targets.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <Link to={`/targets/${t.id}`}>{t.name}</Link>
                      </td>
                      <td className="mono text-secondary">{t.baseUrl}</td>
                      <td>{t.endpointCount ?? 0}</td>
                      <td className="muted">{new Date(t.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
