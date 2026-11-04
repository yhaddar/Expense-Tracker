import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import postgres from 'postgres';

export async function applyMigrations(
  connectionString: string,
  migrationsDirectory: string,
): Promise<void> {
  const client = postgres(connectionString, { max: 1, prepare: false });
  try {
    await client`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
    const files = (await readdir(migrationsDirectory))
      .filter((file) => file.endsWith('.sql'))
      .sort();
    for (const file of files) {
      const applied =
        await client`select name from schema_migrations where name = ${file}`;
      if (applied.length > 0) continue;
      await client.begin(async (transaction) => {
        await transaction.unsafe(
          await readFile(join(migrationsDirectory, file), 'utf8'),
        );
        await transaction`insert into schema_migrations (name) values (${file})`;
      });
    }
  } finally {
    await client.end();
  }
}
