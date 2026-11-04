import { AppShell } from './components/app-shell';
import { OverviewPage } from './components/app-pages';

export default function HomePage() {
  return (
    <AppShell>
      <OverviewPage />
    </AppShell>
  );
}
