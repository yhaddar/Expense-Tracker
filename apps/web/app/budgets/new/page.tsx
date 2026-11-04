import { AppShell } from '../../components/app-shell';
import { BudgetFormPage } from '../../components/app-pages';

export default function NewBudgetRoute() {
  return (
    <AppShell>
      <BudgetFormPage />
    </AppShell>
  );
}
