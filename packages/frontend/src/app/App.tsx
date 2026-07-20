import { Providers } from './providers';
import { AppRoutes } from './router';
import { AppShell } from '../shared/ui/AppShell';

export function App() {
  return (
    <Providers>
      <AppShell>
        <AppRoutes />
      </AppShell>
    </Providers>
  );
}
