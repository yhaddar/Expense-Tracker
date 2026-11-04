import { AppShell } from '../../components/app-shell';
import { TransactionDetailPage } from '../../components/app-pages';

export default async function TransactionRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell>
      <TransactionDetailPage id={id} />
    </AppShell>
  );
}
