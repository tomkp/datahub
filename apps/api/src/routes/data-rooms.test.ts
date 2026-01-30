import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { createDb, type DbConnection } from '../db';
import { tenants, dataRooms } from '../db/schema';
import { dataRoomsRoutes } from './data-rooms';

describe('Data Rooms Routes', () => {
  let conn: DbConnection;
  let app: Hono;

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
      CREATE TABLE data_rooms (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        storage_url TEXT NOT NULL,
        public_url TEXT,
        description TEXT,
        feature_flags TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    conn.db.insert(tenants).values({
      id: 'tenant-1',
      name: 'Test Tenant',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).run();
  });

  afterAll(() => {
    conn.close();
  });

  beforeEach(() => {
    conn.db.run('DELETE FROM data_rooms');
    app = new Hono();
    app.route('/api/data-rooms', dataRoomsRoutes(conn.db));
  });

  describe('GET /api/data-rooms', () => {
    it('returns all data rooms', async () => {
      const res = await app.request('/api/data-rooms');
      expect(res.status).toBe(200);
    });

    it('filters by tenantId', async () => {
      conn.db.insert(dataRooms).values({
        id: 'room-1',
        tenantId: 'tenant-1',
        name: 'Room 1',
        storageUrl: '/data/room1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).run();

      const res = await app.request('/api/data-rooms?tenantId=tenant-1');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveLength(1);
    });
  });

  describe('POST /api/data-rooms', () => {
    it('creates a new data room', async () => {
      const res = await app.request('/api/data-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 'tenant-1',
          name: 'New Room',
          description: 'Test room',
        }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.name).toBe('New Room');
      expect(body.storageUrl).toBeDefined();
    });
  });

  describe('GET /api/data-rooms/:id', () => {
    it('returns data room by id', async () => {
      conn.db.insert(dataRooms).values({
        id: 'room-1',
        tenantId: 'tenant-1',
        name: 'Room 1',
        storageUrl: '/data/room1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).run();

      const res = await app.request('/api/data-rooms/room-1');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.name).toBe('Room 1');
    });

    it('returns 404 for non-existent room', async () => {
      const res = await app.request('/api/data-rooms/non-existent');
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/data-rooms/:id', () => {
    it('deletes data room', async () => {
      conn.db.insert(dataRooms).values({
        id: 'room-1',
        tenantId: 'tenant-1',
        name: 'Room 1',
        storageUrl: '/data/room1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).run();

      const res = await app.request('/api/data-rooms/room-1', { method: 'DELETE' });
      expect(res.status).toBe(204);
    });
  });
});
