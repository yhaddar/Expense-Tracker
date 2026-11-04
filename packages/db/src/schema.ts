import {
  bigint,
  boolean,
  char,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

export const appUsers = pgTable('app_users', {
  id: uuid('id').primaryKey(),
  oidcSubject: text('oidc_subject').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sharedWallets = pgTable('shared_wallets', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const roles = pgTable(
  'roles',
  {
    id: uuid('id').primaryKey(),
    walletId: uuid('wallet_id')
      .notNull()
      .references(() => sharedWallets.id),
    name: text('name').notNull(),
    isSystem: boolean('is_system').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    walletName: unique('roles_wallet_name_unique').on(
      table.walletId,
      table.name,
    ),
  }),
);

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permission: text('permission').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.roleId, table.permission] }),
  }),
);

export const walletMemberships = pgTable(
  'wallet_memberships',
  {
    walletId: uuid('wallet_id')
      .notNull()
      .references(() => sharedWallets.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => appUsers.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id),
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.walletId, table.userId] }),
    userIdx: index('wallet_memberships_user_idx').on(table.userId),
  }),
);

export const userSessions = pgTable('user_sessions', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => appUsers.id, { onDelete: 'cascade' }),
  oidcSessionId: text('oidc_session_id').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const financialAccounts = pgTable('financial_accounts', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => appUsers.id, { onDelete: 'restrict' }),
  openingBalanceMinor: bigint('opening_balance_minor', {
    mode: 'bigint',
  }).notNull(),
  baseCurrency: char('base_currency', { length: 3 }).notNull().default('MAD'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
