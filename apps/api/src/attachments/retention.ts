import { and, eq, lte } from 'drizzle-orm';
import { transactionAttachments, type Database } from '@expense-tracker/db';
import type { PrivateAttachmentStore } from './attachment.store';

export async function purgeExpiredAttachments(
  db: Database,
  storage: PrivateAttachmentStore,
  now = new Date(),
): Promise<{ purged: number }> {
  const rows = await db
    .select()
    .from(transactionAttachments)
    .where(lte(transactionAttachments.retentionUntil, now));
  let purged = 0;
  for (const row of rows) {
    if (row.status === 'clean') await storage.delete(row.objectKey);
    await db
      .delete(transactionAttachments)
      .where(
        and(
          eq(transactionAttachments.id, row.id),
          lte(transactionAttachments.retentionUntil, now),
        ),
      );
    purged += 1;
  }
  return { purged };
}
