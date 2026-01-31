import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { createDb, type DbConnection } from '../db';
import { tenants, dataRooms, folders, files, fileVersions, pipelines, pipelineRuns, pipelineRunSteps, pipelineRunExpectedEvents } from '../db/schema';
import { pipelinesRoutes } from './pipelines';

describe('Pipelines Routes', () => {
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
    conn.db.delete(pipelineRunExpectedEvents).run();
    conn.db.delete(pipelineRunSteps).run();
    conn.db.delete(pipelineRuns).run();
    conn.db.delete(pipelines).run();
    conn.db.delete(fileVersions).run();
    conn.db.delete(files).run();
    app = new Hono();
    app.route('/api', pipelinesRoutes(conn.db));
  });

  describe('GET /data-rooms/:roomId/pipelines', () => {
    it('returns all pipelines for a data room', async () => {
      const now = new Date().toISOString();

      conn.db.insert(pipelines).values({
        id: 'pipeline-1',
        dataRoomId: 'room-1',
        name: 'Test Pipeline',
        datasetKind: 'premium_bordereau',
        steps: JSON.stringify(['malware_scan', 'pii_scan']),
        createdAt: now,
        updatedAt: now,
      }).run();

      const res = await app.request('/api/data-rooms/room-1/pipelines');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveLength(1);
      expect(body[0].name).toBe('Test Pipeline');
    });

    it('returns empty array for data room with no pipelines', async () => {
      const res = await app.request('/api/data-rooms/room-1/pipelines');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual([]);
    });
  });

  describe('POST /data-rooms/:roomId/pipelines', () => {
    it('creates a new pipeline', async () => {
      const res = await app.request('/api/data-rooms/room-1/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetKind: 'claims_bordereau',
          steps: ['malware_scan', 'data_validation'],
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.dataRoomId).toBe('room-1');
      expect(body.datasetKind).toBe('claims_bordereau');
      expect(body.name).toBe('claims_bordereau'); // Default name is datasetKind
    });

    it('returns 400 for invalid input', async () => {
      const res = await app.request('/api/data-rooms/room-1/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetKind: 'invalid_kind',
          steps: ['invalid_step'],
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /pipelines/:id', () => {
    it('returns pipeline by ID', async () => {
      const now = new Date().toISOString();

      conn.db.insert(pipelines).values({
        id: 'pipeline-1',
        dataRoomId: 'room-1',
        name: 'Test Pipeline',
        datasetKind: 'loss_run',
        steps: JSON.stringify(['malware_scan']),
        createdAt: now,
        updatedAt: now,
      }).run();

      const res = await app.request('/api/pipelines/pipeline-1');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBe('pipeline-1');
      expect(body.datasetKind).toBe('loss_run');
    });

    it('returns 404 for non-existent pipeline', async () => {
      const res = await app.request('/api/pipelines/non-existent');
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /pipelines/:id', () => {
    it('updates pipeline', async () => {
      const now = new Date().toISOString();

      conn.db.insert(pipelines).values({
        id: 'pipeline-1',
        dataRoomId: 'room-1',
        name: 'Test Pipeline',
        datasetKind: 'premium_bordereau',
        steps: JSON.stringify(['malware_scan']),
        createdAt: now,
        updatedAt: now,
      }).run();

      const res = await app.request('/api/pipelines/pipeline-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steps: ['malware_scan', 'pii_scan', 'data_validation'],
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.steps).toEqual(['malware_scan', 'pii_scan', 'data_validation']);
    });

    it('returns 404 for non-existent pipeline', async () => {
      const res = await app.request('/api/pipelines/non-existent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps: ['malware_scan'] }),
      });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /pipelines/:id', () => {
    it('deletes pipeline', async () => {
      const now = new Date().toISOString();

      conn.db.insert(pipelines).values({
        id: 'pipeline-1',
        dataRoomId: 'room-1',
        name: 'Test Pipeline',
        datasetKind: 'exposure_data',
        steps: JSON.stringify(['malware_scan']),
        createdAt: now,
        updatedAt: now,
      }).run();

      const res = await app.request('/api/pipelines/pipeline-1', { method: 'DELETE' });
      expect(res.status).toBe(204);

      // Verify deletion
      const pipeline = conn.db.select().from(pipelines).all();
      expect(pipeline).toHaveLength(0);
    });
  });

  describe('GET /pipelines/:pipelineId/runs', () => {
    it('returns enriched pipeline runs with file info', async () => {
      const now = new Date().toISOString();

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
        datasetKind: 'premium_bordereau',
        steps: JSON.stringify(['malware_scan']),
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

      const res = await app.request('/api/pipelines/pipeline-1/runs');
      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body).toHaveLength(1);
      expect(body[0].fileId).toBe('file-1');
      expect(body[0].fileName).toBe('test.pdf');
      expect(body[0].folderId).toBe('folder-1');
      expect(body[0].folderName).toBe('Root Folder');
    });
  });

  describe('GET /file-versions/:versionId/pipeline-run', () => {
    it('returns pipeline run with steps for a file version', async () => {
      const now = new Date().toISOString();

      conn.db.insert(pipelines).values({
        id: 'pipeline-1',
        dataRoomId: 'room-1',
        name: 'Test Pipeline',
        datasetKind: 'claims_bordereau',
        steps: JSON.stringify(['malware_scan', 'pii_scan']),
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
        status: 'processed',
        createdAt: now,
        updatedAt: now,
      }).run();

      const res = await app.request('/api/file-versions/version-1/pipeline-run');
      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.id).toBe('run-1');
      expect(body.runSteps).toHaveLength(1);
      expect(body.runSteps[0].step).toBe('malware_scan');
    });

    it('returns null when no pipeline run exists', async () => {
      const res = await app.request('/api/file-versions/non-existent/pipeline-run');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toBeNull();
    });
  });

  describe('GET /pipeline-runs/:id', () => {
    it('returns pipeline run with steps', async () => {
      const now = new Date().toISOString();

      conn.db.insert(pipelines).values({
        id: 'pipeline-1',
        dataRoomId: 'room-1',
        name: 'Test Pipeline',
        datasetKind: 'loss_run',
        steps: JSON.stringify(['malware_scan']),
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

      conn.db.insert(pipelineRunSteps).values({
        id: 'step-1',
        pipelineRunId: 'run-1',
        step: 'malware_scan',
        status: 'processed',
        createdAt: now,
        updatedAt: now,
      }).run();

      const res = await app.request('/api/pipeline-runs/run-1');
      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.status).toBe('processed');
      expect(body.runSteps).toHaveLength(1);
    });

    it('returns 404 for non-existent run', async () => {
      const res = await app.request('/api/pipeline-runs/non-existent');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /pipeline-runs', () => {
    it('creates pipeline run with initial step records', async () => {
      const now = new Date().toISOString();

      conn.db.insert(pipelines).values({
        id: 'pipeline-1',
        dataRoomId: 'room-1',
        name: 'Test Pipeline',
        datasetKind: 'premium_bordereau',
        steps: JSON.stringify(['malware_scan', 'pii_scan']),
        createdAt: now,
        updatedAt: now,
      }).run();

      const res = await app.request('/api/pipeline-runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipelineId: 'pipeline-1',
          fileVersionId: 'version-1',
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.pipelineId).toBe('pipeline-1');
      expect(body.status).toBe('processing');
      expect(body.id).toBeDefined();
      // Verify steps array is set on the created run
      expect(JSON.parse(body.steps)).toEqual(['malware_scan', 'pii_scan']);
    });

    it('returns 400 when pipelineId is missing', async () => {
      const res = await app.request('/api/pipeline-runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileVersionId: 'version-1' }),
      });

      expect(res.status).toBe(400);
    });

    it('returns 404 when pipeline does not exist', async () => {
      const res = await app.request('/api/pipeline-runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipelineId: 'non-existent',
          fileVersionId: 'version-1',
        }),
      });

      expect(res.status).toBe(404);
    });
  });
});
