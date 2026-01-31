import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { createDb, type DbConnection } from '../db';
import { tenants, dataRooms, pipelines, pipelineRuns, files, fileVersions, folders, users } from '../db/schema';
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
    conn.db.run(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        token_id TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL
      )
    `);
    conn.db.run(`
      CREATE TABLE folders (
        id TEXT PRIMARY KEY,
        data_room_id TEXT NOT NULL,
        parent_id TEXT,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    conn.db.run(`
      CREATE TABLE files (
        id TEXT PRIMARY KEY,
        data_room_id TEXT NOT NULL,
        folder_id TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    conn.db.run(`
      CREATE TABLE file_versions (
        id TEXT PRIMARY KEY,
        file_id TEXT NOT NULL,
        storage_url TEXT NOT NULL,
        uploaded_by TEXT NOT NULL,
        uploaded_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    conn.db.run(`
      CREATE TABLE pipelines (
        id TEXT PRIMARY KEY,
        data_room_id TEXT NOT NULL,
        name TEXT NOT NULL,
        dataset_kind TEXT,
        steps TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    conn.db.run(`
      CREATE TABLE pipeline_runs (
        id TEXT PRIMARY KEY,
        pipeline_id TEXT NOT NULL,
        file_version_id TEXT NOT NULL,
        status TEXT NOT NULL,
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
    conn.db.insert(users).values({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      tokenId: 'token-1',
      createdAt: new Date().toISOString(),
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
    beforeEach(() => {
      conn.db.run('DELETE FROM folders');
    });

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

    it('creates a root folder named after the data room', async () => {
      const res = await app.request('/api/data-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 'tenant-1',
          name: 'Liberty Mutual',
          description: 'Insurance data room',
        }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();

      // Verify root folder was created with the data room's name
      const rootFolder = conn.db.select().from(folders).where(eq(folders.dataRoomId, body.id)).get();
      expect(rootFolder).toBeDefined();
      expect(rootFolder!.name).toBe('Liberty Mutual');
      expect(rootFolder!.parentId).toBeNull();
      expect(rootFolder!.path).toBe('/');
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

  describe('PATCH /api/data-rooms/:id', () => {
    beforeEach(() => {
      conn.db.run('DELETE FROM folders');
    });

    it('updates root folder name when data room name changes', async () => {
      // Create data room with root folder
      const createRes = await app.request('/api/data-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 'tenant-1',
          name: 'Original Name',
        }),
      });
      const created = await createRes.json();

      // Verify initial root folder name
      let rootFolder = conn.db.select().from(folders).where(eq(folders.id, `${created.id}-root`)).get();
      expect(rootFolder!.name).toBe('Original Name');

      // Update data room name
      const updateRes = await app.request(`/api/data-rooms/${created.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Name' }),
      });
      expect(updateRes.status).toBe(200);

      // Verify root folder name was updated
      rootFolder = conn.db.select().from(folders).where(eq(folders.id, `${created.id}-root`)).get();
      expect(rootFolder!.name).toBe('New Name');
    });
  });

  describe('GET /api/data-rooms/:id/pipeline-runs', () => {
    beforeEach(() => {
      conn.db.run('DELETE FROM pipeline_runs');
      conn.db.run('DELETE FROM file_versions');
      conn.db.run('DELETE FROM files');
      conn.db.run('DELETE FROM folders');
      conn.db.run('DELETE FROM pipelines');
    });

    function setupTestData() {
      const now = new Date();
      conn.db.insert(dataRooms).values({
        id: 'room-1',
        tenantId: 'tenant-1',
        name: 'Room 1',
        storageUrl: '/data/room1',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }).run();

      conn.db.insert(folders).values({
        id: 'folder-1',
        dataRoomId: 'room-1',
        name: 'Test Folder',
        path: '/test',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }).run();

      conn.db.insert(files).values({
        id: 'file-1',
        dataRoomId: 'room-1',
        folderId: 'folder-1',
        name: 'test.csv',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }).run();

      conn.db.insert(pipelines).values([
        {
          id: 'pipeline-1',
          dataRoomId: 'room-1',
          name: 'Premium Pipeline',
          datasetKind: 'premium_bordereau',
          steps: JSON.stringify(['malware_scan', 'ingestion']),
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
        {
          id: 'pipeline-2',
          dataRoomId: 'room-1',
          name: 'Claims Pipeline',
          datasetKind: 'claims_bordereau',
          steps: JSON.stringify(['malware_scan', 'pii_scan']),
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      ]).run();

      // Create file versions and pipeline runs with different timestamps
      for (let i = 1; i <= 15; i++) {
        const versionDate = new Date(now.getTime() - i * 60000); // Each 1 minute apart
        conn.db.insert(fileVersions).values({
          id: `version-${i}`,
          fileId: 'file-1',
          storageUrl: `/storage/version-${i}`,
          uploadedBy: 'user-1',
          uploadedAt: versionDate.toISOString(),
          createdAt: versionDate.toISOString(),
          updatedAt: versionDate.toISOString(),
        }).run();

        conn.db.insert(pipelineRuns).values({
          id: `run-${i}`,
          pipelineId: i % 2 === 0 ? 'pipeline-1' : 'pipeline-2', // Alternate between pipelines
          fileVersionId: `version-${i}`,
          status: i % 3 === 0 ? 'errored' : 'processed',
          createdAt: versionDate.toISOString(),
          updatedAt: versionDate.toISOString(),
        }).run();
      }
    }

    it('returns pipeline runs for a data room', async () => {
      setupTestData();

      const res = await app.request('/api/data-rooms/room-1/pipeline-runs');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
    });

    it('returns runs sorted by createdAt descending (most recent first)', async () => {
      setupTestData();

      const res = await app.request('/api/data-rooms/room-1/pipeline-runs');
      const body = await res.json();

      for (let i = 1; i < body.length; i++) {
        const prevDate = new Date(body[i - 1].createdAt).getTime();
        const currDate = new Date(body[i].createdAt).getTime();
        expect(prevDate).toBeGreaterThanOrEqual(currDate);
      }
    });

    it('respects the limit parameter', async () => {
      setupTestData();

      const res = await app.request('/api/data-rooms/room-1/pipeline-runs?limit=5');
      const body = await res.json();
      expect(body.length).toBe(5);
    });

    it('defaults to 10 items when no limit specified', async () => {
      setupTestData();

      const res = await app.request('/api/data-rooms/room-1/pipeline-runs');
      const body = await res.json();
      expect(body.length).toBe(10);
    });

    it('includes runs from all pipelines in the data room', async () => {
      setupTestData();

      const res = await app.request('/api/data-rooms/room-1/pipeline-runs?limit=15');
      const body = await res.json();

      const pipelineIds = new Set(body.map((run: { pipelineId: string }) => run.pipelineId));
      expect(pipelineIds.has('pipeline-1')).toBe(true);
      expect(pipelineIds.has('pipeline-2')).toBe(true);
    });

    it('enriches runs with file and folder information', async () => {
      setupTestData();

      const res = await app.request('/api/data-rooms/room-1/pipeline-runs?limit=1');
      const body = await res.json();

      expect(body[0].fileName).toBe('test.csv');
      expect(body[0].folderName).toBe('Test Folder');
      expect(body[0].fileId).toBe('file-1');
      expect(body[0].folderId).toBe('folder-1');
    });

    it('returns 404 for non-existent data room', async () => {
      const res = await app.request('/api/data-rooms/non-existent/pipeline-runs');
      expect(res.status).toBe(404);
    });

    it('returns empty array when no runs exist', async () => {
      conn.db.insert(dataRooms).values({
        id: 'empty-room',
        tenantId: 'tenant-1',
        name: 'Empty Room',
        storageUrl: '/data/empty',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).run();

      const res = await app.request('/api/data-rooms/empty-room/pipeline-runs');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual([]);
    });
  });
});
