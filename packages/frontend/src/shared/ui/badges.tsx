import type { Severity, ScanStatus, HttpMethod } from '@dast/shared';

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <span className={`sev sev--${severity}`}>{severity}</span>;
}

export function StatusBadge({ status }: { status: ScanStatus }) {
  return <span className={`status status--${status}`}>{status}</span>;
}

export function MethodPill({ method }: { method: HttpMethod }) {
  return <span className={`method method--${method}`}>{method}</span>;
}
