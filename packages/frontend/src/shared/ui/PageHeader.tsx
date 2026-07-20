import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header__text">
        <h1>{title}</h1>
        {subtitle !== undefined && <div className="page-header__subtitle">{subtitle}</div>}
      </div>
      {actions !== undefined && <div className="page-header__actions">{actions}</div>}
    </div>
  );
}
