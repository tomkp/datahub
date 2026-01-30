import { describe, it, expect } from 'vitest';
import { sql } from 'drizzle-orm';
import { createDb } from './index';

describe('Database', () => {
  it('creates an in-memory database connection', () => {
    const db = createDb(':memory:');
    expect(db).toBeDefined();
  });

  it('can execute a simple query', () => {
    const db = createDb(':memory:');
    const result = db.get<{ value: number }>(sql`SELECT 1 as value`);
    expect(result?.value).toBe(1);
  });
});
