import { AppShell } from '../components/app-shell';
import { TransactionsPage } from '../components/app-pages';

export default function TransactionsRoute() {
  return (
    <AppShell>
      <TransactionsPage />
    </AppShell>
  );
}
