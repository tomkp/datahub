import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { createDb, type DbConnection } from '../db';
import { tenants, dataRooms, folders, files, fileVersions, pipelineRuns, pipelineRunSteps, pipelines, users } from '../db/schema';
import { authMiddleware } from '../middleware/auth';
import { filesRoutes } from './files';
import { FileStorage } from '../services/storage';

// Mock storage implementation for tests
class MockFileStorage implements FileStorage {
  async save(): Promise<string> {
    return 'mock-storage-path';
  }
  async read(): Promise<Buffer> {
    return Buffer.from('mock-content');
  }
}

describe('Files Routes', () => {
  let conn: DbConnection;
  let app: Hono;
  let storage: FileStorage;

  beforeAll(() => {
    conn = createDb(':memory:');
    storage = new MockFileStorage();

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
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        token_id TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL
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

    conn.db.insert(users).values({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      tokenId: 'test-token',
      createdAt: now,
    }).run();

    conn.db.insert(dataRooms).values({
      id: 'room-1',
      tenantId: 'tenant-1',
      name: 'Test Room',
      storageUrl: '/data/room1',
      createdAt: now,
      updatedAt: now,
    }).run();

    conn.db.insert(folders).values({
      id: 'folder-1',
      dataRoomId: 'room-1',
      parentId: null,
      name: 'Root Folder',
      path: 'root',
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
    conn.db.run('DELETE FROM data_rooms WHERE id != \'room-1\'');
    app = new Hono();
    app.route('/api', filesRoutes(conn.db, storage));
  });

  // Helper to create app with auth middleware for upload tests
  function createAppWithAuth() {
    const authApp = new Hono();
    authApp.use('/api/*', authMiddleware(conn.db));
    authApp.route('/api', filesRoutes(conn.db, storage));
    return authApp;
  }

  describe('GET /folders/:folderId/files', () => {
    it('returns latestVersion for each file', async () => {
      const now = new Date().toISOString();
      const earlier = new Date(Date.now() - 1000 * 60 * 60).toISOString(); // 1 hour ago

      // Create file with two versions
      conn.db.insert(files).values({
        id: 'file-1',
        dataRoomId: 'room-1',
        folderId: 'folder-1',
        name: 'test.pdf',
        createdAt: earlier,
        updatedAt: now,
      }).run();

      conn.db.insert(fileVersions).values({
        id: 'version-1',
        fileId: 'file-1',
        storageUrl: '/storage/v1',
        uploadedBy: 'user-1',
        uploadedAt: earlier,
        createdAt: earlier,
        updatedAt: earlier,
      }).run();

      conn.db.insert(fileVersions).values({
        id: 'version-2',
        fileId: 'file-1',
        storageUrl: '/storage/v2',
        uploadedBy: 'user-1',
        uploadedAt: now,
        createdAt: now,
        updatedAt: now,
      }).run();

      const res = await app.request('/api/folders/folder-1/files');
      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body).toHaveLength(1);
      expect(body[0].latestVersion).toBeDefined();
      expect(body[0].latestVersion.id).toBe('version-2');
    });

    it('returns pipelineStatus for each file', async () => {
      const now = new Date().toISOString();

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
        storageUrl: '/storage/v1',
        uploadedBy: 'user-1',
        uploadedAt: now,
        createdAt: now,
        updatedAt: now,
      }).run();

      conn.db.insert(pipelines).values({
        id: 'pipeline-1',
        dataRoomId: 'room-1',
        name: 'Test Pipeline',
        steps: JSON.stringify(['step1', 'step2']),
        createdAt: now,
        updatedAt: now,
      }).run();

      conn.db.insert(pipelineRuns).values({
        id: 'run-1',
        pipelineId: 'pipeline-1',
        fileVersionId: 'version-1',
        status: 'processed',
        createdAt: now,
        updatedAt: now,
      }).run();

      const res = await app.request('/api/folders/folder-1/files');
      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body).toHaveLength(1);
      expect(body[0].pipelineStatus).toBe('processed');
    });

    it('returns empty array when folder has no files', async () => {
      const res = await app.request('/api/folders/folder-1/files');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual([]);
    });

    it('returns files with no versions correctly', async () => {
      const now = new Date().toISOString();

      // Create file without versions
      conn.db.insert(files).values({
        id: 'file-1',
        dataRoomId: 'room-1',
        folderId: 'folder-1',
        name: 'test.pdf',
        createdAt: now,
        updatedAt: now,
      }).run();

      const res = await app.request('/api/folders/folder-1/files');
      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body).toHaveLength(1);
      expect(body[0].latestVersion).toBeUndefined();
      expect(body[0].pipelineStatus).toBeUndefined();
    });

    it('orders versions by uploadedAt desc', async () => {
      const now = new Date().toISOString();
      const earlier = new Date(Date.now() - 1000 * 60 * 60).toISOString(); // 1 hour ago
      const earliest = new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(); // 2 hours ago

      // Create file with three versions
      conn.db.insert(files).values({
        id: 'file-1',
        dataRoomId: 'room-1',
        folderId: 'folder-1',
        name: 'test.pdf',
        createdAt: earliest,
        updatedAt: now,
      }).run();

      // Insert in random order to test ordering
      conn.db.insert(fileVersions).values({
        id: 'version-2',
        fileId: 'file-1',
        storageUrl: '/storage/v2',
        uploadedBy: 'user-1',
        uploadedAt: earlier,
        createdAt: earlier,
        updatedAt: earlier,
      }).run();

      conn.db.insert(fileVersions).values({
        id: 'version-3',
        fileId: 'file-1',
        storageUrl: '/storage/v3',
        uploadedBy: 'user-1',
        uploadedAt: now,
        createdAt: now,
        updatedAt: now,
      }).run();

      conn.db.insert(fileVersions).values({
        id: 'version-1',
        fileId: 'file-1',
        storageUrl: '/storage/v1',
        uploadedBy: 'user-1',
        uploadedAt: earliest,
        createdAt: earliest,
        updatedAt: earliest,
      }).run();

      const res = await app.request('/api/folders/folder-1/files');
      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body).toHaveLength(1);
      expect(body[0].latestVersion.id).toBe('version-3');
    });

    it('maps pipeline status correctly for different statuses', async () => {
      const now = new Date().toISOString();

      // Create files with different pipeline statuses
      ['processing', 'processed', 'errored'].forEach((status, idx) => {
        const fileId = `file-${idx}`;
        const versionId = `version-${idx}`;

        conn.db.insert(files).values({
          id: fileId,
          dataRoomId: 'room-1',
          folderId: 'folder-1',
          name: `test-${idx}.pdf`,
          createdAt: now,
          updatedAt: now,
        }).run();

        conn.db.insert(fileVersions).values({
          id: versionId,
          fileId: fileId,
          storageUrl: `/storage/v${idx}`,
          uploadedBy: 'user-1',
          uploadedAt: now,
          createdAt: now,
          updatedAt: now,
        }).run();

        conn.db.insert(pipelines).values({
          id: `pipeline-${idx}`,
          dataRoomId: 'room-1',
          name: `Pipeline ${idx}`,
          steps: JSON.stringify(['step1']),
          createdAt: now,
          updatedAt: now,
        }).run();

        conn.db.insert(pipelineRuns).values({
          id: `run-${idx}`,
          pipelineId: `pipeline-${idx}`,
          fileVersionId: versionId,
          status: status as 'processing' | 'processed' | 'errored',
          createdAt: now,
          updatedAt: now,
        }).run();
      });

      const res = await app.request('/api/folders/folder-1/files');
      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body).toHaveLength(3);
      expect(body.find((f: any) => f.name === 'test-0.pdf').pipelineStatus).toBe('processing');
      expect(body.find((f: any) => f.name === 'test-1.pdf').pipelineStatus).toBe('processed');
      expect(body.find((f: any) => f.name === 'test-2.pdf').pipelineStatus).toBe('errored');
    });
  });

  describe('POST /folders/:folderId/files with pipeline selection', () => {
    it('uploads file with selected pipeline and auto-triggers pipeline run', async () => {
      const authApp = createAppWithAuth();
      const now = new Date().toISOString();

      // Create a pipeline
      conn.db.insert(pipelines).values({
        id: 'pipeline-1',
        dataRoomId: 'room-1',
        name: 'Test Pipeline',
        steps: JSON.stringify(['malware_scan', 'data_validation']),
        createdAt: now,
        updatedAt: now,
      }).run();

      // Upload file with pipeline selection
      const formData = new FormData();
      formData.append('file', new Blob(['test content'], { type: 'text/plain' }), 'test.csv');
      formData.append('pipelineId', 'pipeline-1');

      const res = await authApp.request('/api/folders/folder-1/files', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: 'Bearer test-token',
        },
      });

      expect(res.status).toBe(201);
      const body = await res.json();

      // Verify file was created
      expect(body.name).toBe('test.csv');
      expect(body.latestVersion).toBeDefined();
      expect(body.latestVersion.pipelineId).toBe('pipeline-1');

      // Verify pipeline run was created
      expect(body.pipelineRun).toBeDefined();
      expect(body.pipelineRun.pipelineId).toBe('pipeline-1');
      expect(body.pipelineRun.status).toBe('processing');

      // Verify pipeline run steps were created
      const steps = conn.db.select().from(pipelineRunSteps).all();
      expect(steps).toHaveLength(2);
      expect(steps.map(s => s.step)).toEqual(['malware_scan', 'data_validation']);
    });

    it('uploads file without pipeline (backward compatibility)', async () => {
      const authApp = createAppWithAuth();

      const formData = new FormData();
      formData.append('file', new Blob(['test content'], { type: 'text/plain' }), 'test.csv');

      const res = await authApp.request('/api/folders/folder-1/files', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: 'Bearer test-token',
        },
      });

      expect(res.status).toBe(201);
      const body = await res.json();

      expect(body.name).toBe('test.csv');
      expect(body.latestVersion).toBeDefined();
      expect(body.latestVersion.pipelineId).toBeNull();
      expect(body.pipelineRun).toBeUndefined();
    });

    it('returns 400 when pipeline belongs to different data room', async () => {
      const authApp = createAppWithAuth();
      const now = new Date().toISOString();

      // Create a second data room
      conn.db.insert(dataRooms).values({
        id: 'room-2',
        tenantId: 'tenant-1',
        name: 'Other Room',
        storageUrl: '/data/room2',
        createdAt: now,
        updatedAt: now,
      }).run();

      // Create a pipeline in a different data room
      conn.db.insert(pipelines).values({
        id: 'pipeline-other',
        dataRoomId: 'room-2',
        name: 'Other Pipeline',
        steps: JSON.stringify(['malware_scan']),
        createdAt: now,
        updatedAt: now,
      }).run();

      const formData = new FormData();
      formData.append('file', new Blob(['test content'], { type: 'text/plain' }), 'test.csv');
      formData.append('pipelineId', 'pipeline-other');

      const res = await authApp.request('/api/folders/folder-1/files', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: 'Bearer test-token',
        },
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid pipeline for this data room');
    });

    it('returns 400 when pipeline does not exist', async () => {
      const authApp = createAppWithAuth();

      const formData = new FormData();
      formData.append('file', new Blob(['test content'], { type: 'text/plain' }), 'test.csv');
      formData.append('pipelineId', 'non-existent-pipeline');

      const res = await authApp.request('/api/folders/folder-1/files', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: 'Bearer test-token',
        },
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid pipeline for this data room');
    });
  });

  describe('POST /files/:fileId/versions with pipeline selection', () => {
    it('uploads new version with selected pipeline and auto-triggers pipeline run', async () => {
      const authApp = createAppWithAuth();
      const now = new Date().toISOString();

      // Create file without pipeline
      conn.db.insert(files).values({
        id: 'file-1',
        dataRoomId: 'room-1',
        folderId: 'folder-1',
        name: 'test.csv',
        createdAt: now,
        updatedAt: now,
      }).run();

      conn.db.insert(fileVersions).values({
        id: 'version-1',
        fileId: 'file-1',
        pipelineId: null,
        storageUrl: '/storage/v1',
        uploadedBy: 'user-1',
        uploadedAt: now,
        createdAt: now,
        updatedAt: now,
      }).run();

      // Create a pipeline
      conn.db.insert(pipelines).values({
        id: 'pipeline-1',
        dataRoomId: 'room-1',
        name: 'Test Pipeline',
        steps: JSON.stringify(['malware_scan']),
        createdAt: now,
        updatedAt: now,
      }).run();

      // Upload new version with pipeline
      const formData = new FormData();
      formData.append('file', new Blob(['new content'], { type: 'text/plain' }), 'test.csv');
      formData.append('pipelineId', 'pipeline-1');

      const res = await authApp.request('/api/files/file-1/versions', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: 'Bearer test-token',
        },
      });

      expect(res.status).toBe(201);
      const body = await res.json();

      expect(body.pipelineId).toBe('pipeline-1');
      expect(body.pipelineRun).toBeDefined();
      expect(body.pipelineRun.status).toBe('processing');
    });

    it('returns 400 when pipeline belongs to different data room', async () => {
      const authApp = createAppWithAuth();
      const now = new Date().toISOString();

      // Create file
      conn.db.insert(files).values({
        id: 'file-1',
        dataRoomId: 'room-1',
        folderId: 'folder-1',
        name: 'test.csv',
        createdAt: now,
        updatedAt: now,
      }).run();

      // Create a second data room
      conn.db.insert(dataRooms).values({
        id: 'room-2',
        tenantId: 'tenant-1',
        name: 'Other Room',
        storageUrl: '/data/room2',
        createdAt: now,
        updatedAt: now,
      }).run();

      // Create a pipeline in the other data room
      conn.db.insert(pipelines).values({
        id: 'pipeline-other',
        dataRoomId: 'room-2',
        name: 'Other Pipeline',
        steps: JSON.stringify(['malware_scan']),
        createdAt: now,
        updatedAt: now,
      }).run();

      const formData = new FormData();
      formData.append('file', new Blob(['new content'], { type: 'text/plain' }), 'test.csv');
      formData.append('pipelineId', 'pipeline-other');

      const res = await authApp.request('/api/files/file-1/versions', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: 'Bearer test-token',
        },
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid pipeline for this data room');
    });
  });

  describe('DELETE /files/:id', () => {
    it('deletes file versions, pipeline runs, and pipeline run steps', async () => {
      const now = new Date().toISOString();

      // Create file with version
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
        storageUrl: '/storage/v1',
        uploadedBy: 'user-1',
        uploadedAt: now,
        createdAt: now,
        updatedAt: now,
      }).run();

      // Create pipeline with run and steps
      conn.db.insert(pipelines).values({
        id: 'pipeline-1',
        dataRoomId: 'room-1',
        name: 'Test Pipeline',
        steps: JSON.stringify(['step1', 'step2']),
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
        step: 'step1',
        status: 'processed',
        createdAt: now,
        updatedAt: now,
      }).run();

      conn.db.insert(pipelineRunSteps).values({
        id: 'step-2',
        pipelineRunId: 'run-1',
        step: 'step2',
        status: 'processing',
        createdAt: now,
        updatedAt: now,
      }).run();

      // Verify data exists before delete
      expect(conn.db.select().from(files).all()).toHaveLength(1);
      expect(conn.db.select().from(fileVersions).all()).toHaveLength(1);
      expect(conn.db.select().from(pipelineRuns).all()).toHaveLength(1);
      expect(conn.db.select().from(pipelineRunSteps).all()).toHaveLength(2);

      // Delete file
      const res = await app.request('/api/files/file-1', { method: 'DELETE' });
      expect(res.status).toBe(204);

      // Verify cascade delete
      expect(conn.db.select().from(files).all()).toHaveLength(0);
      expect(conn.db.select().from(fileVersions).all()).toHaveLength(0);
      expect(conn.db.select().from(pipelineRuns).all()).toHaveLength(0);
      expect(conn.db.select().from(pipelineRunSteps).all()).toHaveLength(0);
    });
  });
});
