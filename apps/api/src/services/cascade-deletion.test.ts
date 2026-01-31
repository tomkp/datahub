import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createDb, type DbConnection } from '../db';
import { tenants, dataRooms, folders, files, fileVersions, pipelines, pipelineRuns, pipelineRunSteps, pipelineRunExpectedEvents } from '../db/schema';
import { CascadeDeletionService } from './cascade-deletion';

describe('CascadeDeletionService', () => {
  let conn: DbConnection;
  let service: CascadeDeletionService;

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
        pipeline_id TEXT,
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
        steps TEXT,
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

    // Insert base test data
    const now = new Date().toISOString();
    conn.db.insert(tenants).values({
      id: 'tenant-1',
      name: 'Test Tenant',
      createdAt: now,
      updatedAt: now,
    }).run();
  });

  afterAll(() => {
    conn.close();
  });

  beforeEach(() => {
    conn.db.delete(pipelineRunExpectedEvents).run();
    conn.db.delete(pipelineRunSteps).run();
    conn.db.delete(pipelineRuns).run();
    conn.db.delete(pipelines).run();
    conn.db.delete(fileVersions).run();
    conn.db.delete(files).run();
    conn.db.delete(folders).run();
    conn.db.delete(dataRooms).run();
    service = new CascadeDeletionService(conn.db);
  });

  describe('deleteFile', () => {
    it('deletes file with all versions and pipeline runs', () => {
      const now = new Date().toISOString();

      // Setup data room and folder
      conn.db.insert(dataRooms).values({
        id: 'room-1',
        tenantId: 'tenant-1',
        name: 'Test Room',
        storageUrl: '/data',
        createdAt: now,
        updatedAt: now,
      }).run();

      conn.db.insert(folders).values({
        id: 'folder-1',
        dataRoomId: 'room-1',
        name: 'Root',
        path: '/',
        createdAt: now,
        updatedAt: now,
      }).run();

      // Create file with version and pipeline run
      conn.db.insert(files).values({
        id: 'file-1',
        dataRoomId: 'room-1',
        folderId: 'folder-1',
        name: 'test.pdf',
        createdAt: now,
        updatedAt: now,
      }).run();

      conn.db.insert(fileVersions).values({
        id: 'version-1',
        fileId: 'file-1',
        storageUrl: '/v1',
        uploadedBy: 'user-1',
        uploadedAt: now,
        createdAt: now,
        updatedAt: now,
      }).run();

      conn.db.insert(pipelines).values({
        id: 'pipeline-1',
        dataRoomId: 'room-1',
        name: 'Test',
        steps: '[]',
        createdAt: now,
        updatedAt: now,
      }).run();

      conn.db.insert(pipelineRuns).values({
        id: 'run-1',
        pipelineId: 'pipeline-1',
        fileVersionId: 'version-1',
        status: 'processing',
        createdAt: now,
        updatedAt: now,
      }).run();

      conn.db.insert(pipelineRunSteps).values({
        id: 'step-1',
        pipelineRunId: 'run-1',
        step: 'malware_scan',
        status: 'processing',
        createdAt: now,
        updatedAt: now,
      }).run();

      // Verify data exists
      expect(conn.db.select().from(files).all()).toHaveLength(1);
      expect(conn.db.select().from(pipelineRunSteps).all()).toHaveLength(1);

      // Delete file
      service.deleteFile('file-1');

      // Verify cascade delete
      expect(conn.db.select().from(files).all()).toHaveLength(0);
      expect(conn.db.select().from(fileVersions).all()).toHaveLength(0);
      expect(conn.db.select().from(pipelineRuns).all()).toHaveLength(0);
      expect(conn.db.select().from(pipelineRunSteps).all()).toHaveLength(0);
    });
  });

  describe('collectFolderIds', () => {
    it('collects all descendant folder IDs', () => {
      const now = new Date().toISOString();

      conn.db.insert(dataRooms).values({
        id: 'room-1',
        tenantId: 'tenant-1',
        name: 'Test Room',
        storageUrl: '/data',
        createdAt: now,
        updatedAt: now,
      }).run();

      // Create hierarchy: root -> child1 -> grandchild
      conn.db.insert(folders).values({
        id: 'root',
        dataRoomId: 'room-1',
        name: 'Root',
        path: '/',
        createdAt: now,
        updatedAt: now,
      }).run();

      conn.db.insert(folders).values({
        id: 'child1',
        dataRoomId: 'room-1',
        parentId: 'root',
        name: 'Child 1',
        path: '/child1',
        createdAt: now,
        updatedAt: now,
      }).run();

      conn.db.insert(folders).values({
        id: 'grandchild',
        dataRoomId: 'room-1',
        parentId: 'child1',
        name: 'Grandchild',
        path: '/child1/grandchild',
        createdAt: now,
        updatedAt: now,
      }).run();

      const ids = service.collectFolderIds('root');

      expect(ids).toHaveLength(3);
      expect(ids).toContain('root');
      expect(ids).toContain('child1');
      expect(ids).toContain('grandchild');
    });
  });

  describe('deleteDataRoom', () => {
    it('deletes data room with all related entities', () => {
      const now = new Date().toISOString();

      conn.db.insert(dataRooms).values({
        id: 'room-1',
        tenantId: 'tenant-1',
        name: 'Test Room',
        storageUrl: '/data',
        createdAt: now,
        updatedAt: now,
      }).run();

      conn.db.insert(folders).values({
        id: 'folder-1',
        dataRoomId: 'room-1',
        name: 'Root',
        path: '/',
        createdAt: now,
        updatedAt: now,
      }).run();

      conn.db.insert(pipelines).values({
        id: 'pipeline-1',
        dataRoomId: 'room-1',
        name: 'Test',
        steps: '[]',
        createdAt: now,
        updatedAt: now,
      }).run();

      // Verify data exists
      expect(conn.db.select().from(dataRooms).all()).toHaveLength(1);
      expect(conn.db.select().from(folders).all()).toHaveLength(1);
      expect(conn.db.select().from(pipelines).all()).toHaveLength(1);

      // Delete data room
      service.deleteDataRoom('room-1');

      // Verify cascade delete
      expect(conn.db.select().from(dataRooms).all()).toHaveLength(0);
      expect(conn.db.select().from(folders).all()).toHaveLength(0);
      expect(conn.db.select().from(pipelines).all()).toHaveLength(0);
    });
  });
});
