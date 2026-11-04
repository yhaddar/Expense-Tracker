import {
  bigint,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { appUsers, sharedWallets } from './schema';
import { categories } from './ledger-schema';

export const budgets = pgTable(
  'budgets',
  {
    id: uuid('id').primaryKey(),
    walletId: uuid('wallet_id')
      .notNull()
      .references(() => sharedWallets.id, { onDelete: 'cascade' }),
    budgetScopeKey: text('budget_scope_key').notNull(),
    categoryId: uuid('category_id').references(() => categories.id),
    monthStart: date('month_start').notNull(),
    limitMadMinor: bigint('limit_mad_minor', { mode: 'bigint' }).notNull(),
    thresholdPercent: integer('threshold_percent').notNull().default(80),
    currentMadMinor: bigint('current_mad_minor', { mode: 'bigint' })
      .notNull()
      .default(0n),
    thresholdState: text('threshold_state').notNull().default('normal'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    scopeMonth: unique('budgets_wallet_scope_month_unique').on(
      table.walletId,
      table.budgetScopeKey,
      table.monthStart,
    ),
  }),
);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey(),
    walletId: uuid('wallet_id')
      .notNull()
      .references(() => sharedWallets.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => appUsers.id, { onDelete: 'cascade' }),
    eventType: text('event_type').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    entityId: uuid('entity_id'),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userCreated: index('notifications_user_created_idx').on(
      table.userId,
      table.createdAt,
    ),
  }),
);
