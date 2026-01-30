import { describe, it, expect, afterEach } from 'vitest';
import { sql } from 'drizzle-orm';
import { createDb, type DbConnection } from './index';

describe('Database', () => {
  const connections: DbConnection[] = [];

  afterEach(() => {
    connections.forEach((conn) => conn.close());
    connections.length = 0;
  });

  it('creates an in-memory database connection', () => {
    const conn = createDb(':memory:');
    connections.push(conn);
    expect(conn.db).toBeDefined();
  });

  it('can execute a simple query', () => {
    const conn = createDb(':memory:');
    connections.push(conn);
    const result = conn.db.get<{ value: number }>(sql`SELECT 1 as value`);
    expect(result?.value).toBe(1);
  });

  it('can close the connection', () => {
    const conn = createDb(':memory:');
    expect(() => conn.close()).not.toThrow();
  });
});
