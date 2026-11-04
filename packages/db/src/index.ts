export const databaseFoundation = {
  provider: 'postgresql',
  orm: 'drizzle',
  migrations: 'reviewed-sql',
} as const;
export * from './client';
export * from './migrate';
export * from './schema';
export * from './ledger-schema';
export * from './budget-schema';
export * from './attachment-schema';
