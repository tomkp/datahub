import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import * as schema from './schema';

export type AppDatabase = BetterSQLite3Database<typeof schema>;

export interface DbConnection {
  db: AppDatabase;
  close: () => void;
}

export function createDb(url: string): DbConnection {
  // Ensure directory exists for file-based databases
  if (url !== ':memory:') {
    mkdirSync(dirname(url), { recursive: true });
  }

  const sqlite = new Database(url);
  sqlite.pragma('journal_mode = WAL');

  const db = drizzle(sqlite, { schema });

  return {
    db,
    close: () => sqlite.close(),
  };
}
