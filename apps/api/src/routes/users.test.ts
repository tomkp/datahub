import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { createDb, type DbConnection } from '../db';
import { users } from '../db/schema';
import { usersRoutes } from './users';

describe('Users Routes', () => {
  let conn: DbConnection;
  let app: Hono;

  beforeAll(() => {
    conn = createDb(':memory:');
    conn.db.run(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        token_id TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  });

  afterAll(() => {
    conn.close();
  });

  beforeEach(() => {
    conn.db.run('DELETE FROM users');
    app = new Hono();
    app.route('/api/users', usersRoutes(conn.db));
  });

  describe('GET /api/users', () => {
    it('returns all users', async () => {
      conn.db.insert(users).values({
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        tokenId: 'token-1',
      }).run();

      const res = await app.request('/api/users');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveLength(1);
    });
  });

  describe('POST /api/users', () => {
    it('creates a new user', async () => {
      const res = await app.request('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Jane Doe', email: 'jane@example.com' }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.name).toBe('Jane Doe');
      expect(body.tokenId).toBeDefined();
    });

    it('returns 400 for invalid email', async () => {
      const res = await app.request('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Jane', email: 'invalid' }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/users/:id', () => {
    it('returns user by id', async () => {
      conn.db.insert(users).values({
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        tokenId: 'token-1',
      }).run();

      const res = await app.request('/api/users/user-1');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.name).toBe('John Doe');
    });

    it('returns 404 for non-existent user', async () => {
      const res = await app.request('/api/users/non-existent');
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('deletes user', async () => {
      conn.db.insert(users).values({
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        tokenId: 'token-1',
      }).run();

      const res = await app.request('/api/users/user-1', { method: 'DELETE' });
      expect(res.status).toBe(204);
    });
  });
});
