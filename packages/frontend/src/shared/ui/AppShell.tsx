import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <header className="shell__header">
        <Link to="/" className="shell__brand">
          <span className="shell__brand-mark">🛡️</span>
          <span>DAST Platform</span>
        </Link>
        <span className="shell__tag">OpenAPI-driven dynamic security testing</span>
      </header>
      <main className="shell__main">{children}</main>
    </div>
  );
}
