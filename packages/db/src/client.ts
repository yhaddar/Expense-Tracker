import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Database = PostgresJsDatabase<typeof schema>;

export function createDatabase(connectionString: string): {
  db: Database;
  close: () => Promise<void>;
} {
  const client = postgres(connectionString, { max: 5, prepare: false });
  return { db: drizzle(client, { schema }), close: () => client.end() };
}
