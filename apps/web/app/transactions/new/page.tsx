import { AppShell } from '../../components/app-shell';
import { TransactionFormPage } from '../../components/app-pages';

export default function NewTransactionRoute() {
  return (
    <AppShell>
      <TransactionFormPage />
    </AppShell>
  );
}
