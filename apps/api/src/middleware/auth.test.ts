import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { createDb, type DbConnection } from '../db';
import { users } from '../db/schema';
import { authMiddleware, getUser } from './auth';

describe('Auth Middleware', () => {
  let conn: DbConnection;
  let app: Hono;
  const testUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test User',
    email: 'test@example.com',
    tokenId: 'test-token-123',
  };

  beforeAll(async () => {
    conn = createDb(':memory:');

    // Create users table
    conn.db.run(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        token_id TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Insert test user
    conn.db.insert(users).values(testUser).run();
  });

  afterAll(() => {
    conn.close();
  });

  beforeEach(() => {
    app = new Hono();
    app.use('*', authMiddleware(conn.db));
    app.get('/protected', (c) => {
      const user = getUser(c);
      return c.json({ user });
    });
  });

  it('returns 401 when no Authorization header', async () => {
    const res = await app.request('/protected');
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when Authorization header is not Bearer', async () => {
    const res = await app.request('/protected', {
      headers: { Authorization: 'Basic invalid' },
    });
    expect(res.status).toBe(401);
  });

  it('returns 401 when token is invalid', async () => {
    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer invalid-token' },
    });
    expect(res.status).toBe(401);
  });

  it('allows request with valid token', async () => {
    const res = await app.request('/protected', {
      headers: { Authorization: `Bearer ${testUser.tokenId}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.id).toBe(testUser.id);
    expect(body.user.email).toBe(testUser.email);
  });

  it('attaches user to context', async () => {
    const res = await app.request('/protected', {
      headers: { Authorization: `Bearer ${testUser.tokenId}` },
    });
    const body = await res.json();
    expect(body.user).toBeDefined();
    expect(body.user.name).toBe(testUser.name);
  });
});
