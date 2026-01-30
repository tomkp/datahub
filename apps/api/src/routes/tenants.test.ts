import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { createDb, type DbConnection } from '../db';
import { users, tenants } from '../db/schema';
import { tenantsRoutes } from './tenants';

describe('Tenants Routes', () => {
  let conn: DbConnection;
  let app: Hono;
  const testUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    tokenId: 'test-token',
  };

  beforeAll(() => {
    conn = createDb(':memory:');
    conn.db.run(`
      CREATE TABLE tenants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    conn.db.run(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        token_id TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    conn.db.insert(users).values(testUser).run();
  });

  afterAll(() => {
    conn.close();
  });

  beforeEach(() => {
    conn.db.run('DELETE FROM tenants');
    app = new Hono();
    app.route('/api/tenants', tenantsRoutes(conn.db));
  });

  const authHeader = { Authorization: `Bearer ${testUser.tokenId}` };

  describe('GET /api/tenants', () => {
    it('returns empty array when no tenants', async () => {
      const res = await app.request('/api/tenants', { headers: authHeader });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual([]);
    });

    it('returns all tenants', async () => {
      conn.db.insert(tenants).values({
        id: 'tenant-1',
        name: 'Acme Corp',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).run();

      const res = await app.request('/api/tenants', { headers: authHeader });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveLength(1);
      expect(body[0].name).toBe('Acme Corp');
    });
  });

  describe('POST /api/tenants', () => {
    it('creates a new tenant', async () => {
      const res = await app.request('/api/tenants', {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Tenant' }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.name).toBe('New Tenant');
      expect(body.id).toBeDefined();
    });

    it('returns 400 for invalid input', async () => {
      const res = await app.request('/api/tenants', {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/tenants/:id', () => {
    it('returns tenant by id', async () => {
      conn.db.insert(tenants).values({
        id: 'tenant-1',
        name: 'Acme Corp',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).run();

      const res = await app.request('/api/tenants/tenant-1', { headers: authHeader });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.name).toBe('Acme Corp');
    });

    it('returns 404 for non-existent tenant', async () => {
      const res = await app.request('/api/tenants/non-existent', { headers: authHeader });
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/tenants/:id', () => {
    it('updates tenant', async () => {
      conn.db.insert(tenants).values({
        id: 'tenant-1',
        name: 'Acme Corp',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).run();

      const res = await app.request('/api/tenants/tenant-1', {
        method: 'PATCH',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Name' }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.name).toBe('Updated Name');
    });
  });

  describe('DELETE /api/tenants/:id', () => {
    it('deletes tenant', async () => {
      conn.db.insert(tenants).values({
        id: 'tenant-1',
        name: 'Acme Corp',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).run();

      const res = await app.request('/api/tenants/tenant-1', {
        method: 'DELETE',
        headers: authHeader,
      });
      expect(res.status).toBe(204);
    });
  });
});
