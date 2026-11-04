import {
  bigint,
  boolean,
  char,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { appUsers, financialAccounts, sharedWallets } from './schema';

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey(),
  walletId: uuid('wallet_id')
    .notNull()
    .references(() => sharedWallets.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  isSystem: boolean('is_system').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const transactionRecords = pgTable(
  'transaction_records',
  {
    id: uuid('id').primaryKey(),
    walletId: uuid('wallet_id')
      .notNull()
      .references(() => sharedWallets.id),
    accountId: uuid('account_id')
      .notNull()
      .references(() => financialAccounts.id),
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => appUsers.id),
    categoryId: uuid('category_id').references(() => categories.id),
    transactionType: text('transaction_type').notNull(),
    originalTransactionId: uuid('original_transaction_id'),
    recurringTemplateId: uuid('recurring_template_id'),
    transferGroupId: uuid('transfer_group_id'),
    linkedTransactionId: uuid('linked_transaction_id'),
    amountMinor: bigint('amount_minor', { mode: 'bigint' }).notNull(),
    currency: char('currency', { length: 3 }).notNull(),
    amountMadMinor: bigint('amount_mad_minor', { mode: 'bigint' }).notNull(),
    exchangeRate: numeric('exchange_rate', {
      precision: 30,
      scale: 12,
    }).notNull(),
    rateTimestamp: timestamp('rate_timestamp', { withTimezone: true }),
    rateSource: text('rate_source'),
    paymentMethod: text('payment_method').notNull(),
    transactionDate: date('transaction_date').notNull(),
    note: text('note'),
    version: integer('version').notNull().default(1),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    accountDate: index('transaction_records_account_date_idx').on(
      table.accountId,
      table.transactionDate,
    ),
    walletDate: index('transaction_records_wallet_date_idx').on(
      table.walletId,
      table.transactionDate,
    ),
    transferGroup: index('transaction_records_transfer_group_idx').on(
      table.transferGroupId,
    ),
  }),
);

export const auditEvents = pgTable('audit_events', {
  id: uuid('id').primaryKey(),
  walletId: uuid('wallet_id')
    .notNull()
    .references(() => sharedWallets.id),
  actorId: uuid('actor_id')
    .notNull()
    .references(() => appUsers.id),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const recurringTemplates = pgTable('recurring_templates', {
  id: uuid('id').primaryKey(),
  walletId: uuid('wallet_id')
    .notNull()
    .references(() => sharedWallets.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id')
    .notNull()
    .references(() => financialAccounts.id),
  creatorId: uuid('creator_id')
    .notNull()
    .references(() => appUsers.id),
  categoryId: uuid('category_id'),
  transactionType: text('transaction_type').notNull(),
  amountMinor: bigint('amount_minor', { mode: 'bigint' }).notNull(),
  currency: char('currency', { length: 3 }).notNull(),
  amountMadMinor: bigint('amount_mad_minor', { mode: 'bigint' }).notNull(),
  exchangeRate: numeric('exchange_rate', {
    precision: 30,
    scale: 12,
  }).notNull(),
  paymentMethod: text('payment_method').notNull(),
  frequency: text('frequency').notNull(),
  nextOccurrenceDate: date('next_occurrence_date').notNull(),
  status: text('status').notNull().default('active'),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const idempotencyKeys = pgTable(
  'idempotency_keys',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => appUsers.id, { onDelete: 'cascade' }),
    operationKey: text('operation_key').notNull(),
    requestHash: text('request_hash').notNull(),
    responseStatus: integer('response_status'),
    responseBody: jsonb('response_body'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.operationKey] }),
  }),
);
