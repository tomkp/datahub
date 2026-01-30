import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

export type AppDatabase = BetterSQLite3Database<typeof schema>;

export interface DbConnection {
  db: AppDatabase;
  close: () => void;
}

export function createDb(url: string): DbConnection {
  const sqlite = new Database(url);
  sqlite.pragma('journal_mode = WAL');

  const db = drizzle(sqlite, { schema });

  return {
    db,
    close: () => sqlite.close(),
  };
}
