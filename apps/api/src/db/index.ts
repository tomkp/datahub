import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

export function createDb(url: string) {
  const sqlite = new Database(url);
  sqlite.pragma('journal_mode = WAL');
  return drizzle(sqlite, { schema });
}

export type AppDatabase = ReturnType<typeof createDb>;
