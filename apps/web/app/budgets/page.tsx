import { AppShell } from '../components/app-shell';
import { BudgetsPage } from '../components/app-pages';

export default function BudgetsRoute() {
  return (
    <AppShell>
      <BudgetsPage />
    </AppShell>
  );
}
