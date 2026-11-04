import {
  bigint,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { appUsers, sharedWallets } from './schema';
import { transactionRecords } from './ledger-schema';

export const transactionAttachments = pgTable(
  'transaction_attachments',
  {
    id: uuid('id').primaryKey(),
    walletId: uuid('wallet_id')
      .notNull()
      .references(() => sharedWallets.id, { onDelete: 'cascade' }),
    transactionId: uuid('transaction_id')
      .notNull()
      .references(() => transactionRecords.id, { onDelete: 'cascade' }),
    uploaderId: uuid('uploader_id')
      .notNull()
      .references(() => appUsers.id),
    objectKey: text('object_key').notNull(),
    originalFilename: text('original_filename').notNull(),
    detectedContentType: text('detected_content_type').notNull(),
    sizeBytes: bigint('size_bytes', { mode: 'bigint' }).notNull(),
    sha256: text('sha256').notNull(),
    status: text('status').notNull().default('pending'),
    retentionUntil: timestamp('retention_until', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    objectKeyUnique: unique('transaction_attachments_object_key_unique').on(
      table.objectKey,
    ),
    transactionIdx: index('transaction_attachments_transaction_idx').on(
      table.transactionId,
      table.createdAt,
    ),
  }),
);
