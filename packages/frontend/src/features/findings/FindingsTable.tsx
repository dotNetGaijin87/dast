import { useState } from 'react';
import { OWASP_API_TITLES, type FindingDto } from '@dast/shared';
import { SeverityBadge, MethodPill } from '../../shared/ui/badges';
import { EmptyState } from '../../shared/ui/misc';

export function FindingsTable({ findings }: { findings: FindingDto[] }) {
  if (findings.length === 0) {
    return <EmptyState>No findings recorded for this scan.</EmptyState>;
  }

  return (
    <div className="table__scroll">
      <table className="table">
        <thead>
          <tr>
            <th>Severity</th>
            <th>Finding</th>
            <th>Location</th>
            <th>OWASP</th>
            <th>Engine</th>
          </tr>
        </thead>
        <tbody>
          {findings.map((f) => (
            <FindingRow key={f.id} finding={f} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FindingRow({ finding }: { finding: FindingDto }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr onClick={() => setOpen((o) => !o)} style={{ cursor: 'pointer' }}>
        <td>
          <SeverityBadge severity={finding.severity} />
        </td>
        <td>{finding.title}</td>
        <td className="mono">
          {finding.method && <MethodPill method={finding.method} />} {finding.path ?? ''}
        </td>
        <td className="muted" title={OWASP_API_TITLES[finding.owaspCategory]}>
          {finding.owaspCategory}
        </td>
        <td className="muted">{finding.engine}</td>
      </tr>
      {open && (
        <tr>
          <td colSpan={5}>
            <div className="stack" style={{ gap: 8 }}>
              <div className="text-secondary">{finding.description}</div>
              {finding.remediation && (
                <div>
                  <strong>Remediation:</strong> {finding.remediation}
                </div>
              )}
              {finding.evidence && (
                <pre className="console">
                  <code>{JSON.stringify(finding.evidence, null, 2)}</code>
                </pre>
              )}
              <div className="muted">{OWASP_API_TITLES[finding.owaspCategory]}</div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
