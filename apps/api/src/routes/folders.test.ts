import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { createDb, type DbConnection } from '../db';
import { tenants, dataRooms, folders, files, fileVersions, pipelineRuns, pipelineRunSteps, pipelines } from '../db/schema';
import { foldersRoutes } from './folders';

describe('Folders Routes', () => {
  let conn: DbConnection;
  let app: Hono;

  beforeAll(() => {
    conn = createDb(':memory:');

    // Create all required tables
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
    conn.db.run(`
      CREATE TABLE pipeline_run_steps (
        id TEXT PRIMARY KEY,
        pipeline_run_id TEXT NOT NULL,
        step TEXT NOT NULL,
        status TEXT NOT NULL,
        error_message TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    conn.db.run(`
      CREATE TABLE pipeline_run_expected_events (
        pipeline_run_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        event_ref TEXT NOT NULL,
        event_received_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Insert test data
    const now = new Date().toISOString();
    conn.db.insert(tenants).values({
      id: 'tenant-1',
      name: 'Test Tenant',
      createdAt: now,
      updatedAt: now,
    }).run();

    conn.db.insert(dataRooms).values({
      id: 'room-1',
      tenantId: 'tenant-1',
      name: 'Test Room',
      storageUrl: '/data/room1',
      createdAt: now,
      updatedAt: now,
    }).run();
  });

  afterAll(() => {
    conn.close();
  });

  beforeEach(() => {
    conn.db.run('DELETE FROM pipeline_run_steps');
    conn.db.run('DELETE FROM pipeline_runs');
    conn.db.run('DELETE FROM pipelines');
    conn.db.run('DELETE FROM file_versions');
    conn.db.run('DELETE FROM files');
    conn.db.run('DELETE FROM folders');
    app = new Hono();
    app.route('/api', foldersRoutes(conn.db));
  });

  describe('GET /data-rooms/:roomId/folders', () => {
    it('returns all folders for a data room', async () => {
      const now = new Date().toISOString();

      conn.db.insert(folders).values({
        id: 'folder-1',
        dataRoomId: 'room-1',
        name: 'Root',
        path: '/Root',
        createdAt: now,
        updatedAt: now,
      }).run();

      const res = await app.request('/api/data-rooms/room-1/folders');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveLength(1);
      expect(body[0].name).toBe('Root');
    });
  });

  describe('POST /data-rooms/:roomId/folders', () => {
    it('creates a new folder', async () => {
      const res = await app.request('/api/data-rooms/room-1/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Folder' }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.name).toBe('New Folder');
      expect(body.dataRoomId).toBe('room-1');
    });
  });

  describe('DELETE /folders/:id', () => {
    it('deletes folder and all nested content recursively', async () => {
      const now = new Date().toISOString();

      // Create parent folder
      conn.db.insert(folders).values({
        id: 'folder-parent',
        dataRoomId: 'room-1',
        name: 'Parent',
        path: '/Parent',
        createdAt: now,
        updatedAt: now,
      }).run();

      // Create child folder
      conn.db.insert(folders).values({
        id: 'folder-child',
        dataRoomId: 'room-1',
        parentId: 'folder-parent',
        name: 'Child',
        path: '/Parent/Child',
        createdAt: now,
        updatedAt: now,
      }).run();

      // Create file in child folder
      conn.db.insert(files).values({
        id: 'file-1',
        dataRoomId: 'room-1',
        folderId: 'folder-child',
        name: 'test.pdf',
        createdAt: now,
        updatedAt: now,
      }).run();

      // Create file version
      conn.db.insert(fileVersions).values({
        id: 'version-1',
        fileId: 'file-1',
        storageUrl: '/storage/v1',
        uploadedBy: 'user-1',
        uploadedAt: now,
        createdAt: now,
        updatedAt: now,
      }).run();

      // Create pipeline
      conn.db.insert(pipelines).values({
        id: 'pipeline-1',
        dataRoomId: 'room-1',
        name: 'Test Pipeline',
        steps: JSON.stringify(['step1']),
        createdAt: now,
        updatedAt: now,
      }).run();

      // Create pipeline run
      conn.db.insert(pipelineRuns).values({
        id: 'run-1',
        pipelineId: 'pipeline-1',
        fileVersionId: 'version-1',
        status: 'processing',
        createdAt: now,
        updatedAt: now,
      }).run();

      // Create pipeline run step
      conn.db.insert(pipelineRunSteps).values({
        id: 'step-1',
        pipelineRunId: 'run-1',
        step: 'step1',
        status: 'processing',
        createdAt: now,
        updatedAt: now,
      }).run();

      // Verify data exists
      expect(conn.db.select().from(folders).all()).toHaveLength(2);
      expect(conn.db.select().from(files).all()).toHaveLength(1);
      expect(conn.db.select().from(fileVersions).all()).toHaveLength(1);
      expect(conn.db.select().from(pipelineRuns).all()).toHaveLength(1);
      expect(conn.db.select().from(pipelineRunSteps).all()).toHaveLength(1);

      // Delete parent folder
      const res = await app.request('/api/folders/folder-parent', { method: 'DELETE' });
      expect(res.status).toBe(204);

      // Verify cascade delete
      expect(conn.db.select().from(folders).all()).toHaveLength(0);
      expect(conn.db.select().from(files).all()).toHaveLength(0);
      expect(conn.db.select().from(fileVersions).all()).toHaveLength(0);
      expect(conn.db.select().from(pipelineRuns).all()).toHaveLength(0);
      expect(conn.db.select().from(pipelineRunSteps).all()).toHaveLength(0);
    });
  });
});
