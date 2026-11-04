import { AppShell } from '../../../components/app-shell';
import { TransactionFormPage } from '../../../components/app-pages';

export default async function EditTransactionRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell>
      <TransactionFormPage editId={id} />
    </AppShell>
  );
}
