import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

interface CardProps {
  children: ReactNode;
  title?: ReactNode;
  className?: string;
}

export function Card({ children, title, className }: CardProps) {
  return (
    <div className={cn('card', className)}>
      {title !== undefined && <div className="card__title">{title}</div>}
      {children}
    </div>
  );
}
