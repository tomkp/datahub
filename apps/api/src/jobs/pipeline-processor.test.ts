import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createDb, type DbConnection } from '../db';
import { pipelines, pipelineRuns, pipelineRunSteps, fileVersions, files, folders, dataRooms, tenants } from '../db/schema';
import { PipelineProcessor } from './pipeline-processor';
import { JobQueue } from './queue';

describe('PipelineProcessor', () => {
  let conn: DbConnection;
  let queue: JobQueue;
  let processor: PipelineProcessor;

  beforeEach(async () => {
    conn = createDb(':memory:');

    // Create tables
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
        steps TEXT NOT NULL,
        dataset_kind TEXT,
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

    queue = new JobQueue({ concurrency: 1 });
    processor = new PipelineProcessor(conn.db, queue);
  });

  afterEach(async () => {
    await queue.onIdle();
    conn.close();
  });

  async function setupTestData() {
    const now = new Date().toISOString();

    // Create tenant
    conn.db.insert(tenants).values({
      id: 'tenant-1',
      name: 'Test Tenant',
      createdAt: now,
      updatedAt: now,
    }).run();

    // Create data room
    conn.db.insert(dataRooms).values({
      id: 'room-1',
      tenantId: 'tenant-1',
      name: 'Test Room',
      storageUrl: '/storage/room-1',
      createdAt: now,
      updatedAt: now,
    }).run();

    // Create folder
    conn.db.insert(folders).values({
      id: 'folder-1',
      dataRoomId: 'room-1',
      name: 'Root',
      path: '/Root',
      createdAt: now,
      updatedAt: now,
    }).run();

    // Create file
    conn.db.insert(files).values({
      id: 'file-1',
      dataRoomId: 'room-1',
      folderId: 'folder-1',
      name: 'test.csv',
      createdAt: now,
      updatedAt: now,
    }).run();

    // Create file version
    conn.db.insert(fileVersions).values({
      id: 'version-1',
      fileId: 'file-1',
      storageUrl: '/storage/room-1/file-1/version-1/test.csv',
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
      steps: JSON.stringify(['malware_scan', 'pii_scan']),
      createdAt: now,
      updatedAt: now,
    }).run();
  }

  it('processes a pipeline run through all steps', async () => {
    await setupTestData();

    const runId = await processor.startPipelineRun('pipeline-1', 'version-1');

    // Wait for processing to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    const run = conn.db.select().from(pipelineRuns).all().find((r) => r.id === runId);
    expect(run?.status).toBe('processed');

    const steps = conn.db.select().from(pipelineRunSteps).all().filter((s) => s.pipelineRunId === runId);
    expect(steps).toHaveLength(2);
    expect(steps.every((s) => s.status === 'processed')).toBe(true);
  });

  it('creates pipeline run with processing status', async () => {
    await setupTestData();

    const runId = await processor.startPipelineRun('pipeline-1', 'version-1');

    const run = conn.db.select().from(pipelineRuns).all().find((r) => r.id === runId);
    expect(run).toBeDefined();
    expect(run?.pipelineId).toBe('pipeline-1');
    expect(run?.fileVersionId).toBe('version-1');
  });

  it('creates step records for each pipeline step', async () => {
    await setupTestData();

    const runId = await processor.startPipelineRun('pipeline-1', 'version-1');

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 100));

    const steps = conn.db.select().from(pipelineRunSteps).all().filter((s) => s.pipelineRunId === runId);
    expect(steps).toHaveLength(2);
    expect(steps.map((s) => s.step)).toContain('malware_scan');
    expect(steps.map((s) => s.step)).toContain('pii_scan');
  });

  it('marks run as errored if a step fails', async () => {
    await setupTestData();

    // Override step processor to simulate failure
    processor.setStepHandler('malware_scan', async () => {
      throw new Error('Malware detected');
    });

    const runId = await processor.startPipelineRun('pipeline-1', 'version-1');

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 100));

    const run = conn.db.select().from(pipelineRuns).all().find((r) => r.id === runId);
    expect(run?.status).toBe('errored');

    const steps = conn.db.select().from(pipelineRunSteps).all().filter((s) => s.pipelineRunId === runId);
    const failedStep = steps.find((s) => s.step === 'malware_scan');
    expect(failedStep?.status).toBe('errored');
    expect(failedStep?.errorMessage).toBe('Malware detected');
  });

  it('can retry a failed pipeline run', async () => {
    await setupTestData();

    let shouldFail = true;
    processor.setStepHandler('malware_scan', async () => {
      if (shouldFail) {
        throw new Error('Temporary failure');
      }
    });

    const runId = await processor.startPipelineRun('pipeline-1', 'version-1');

    // Wait for initial processing
    await new Promise((resolve) => setTimeout(resolve, 100));

    let run = conn.db.select().from(pipelineRuns).all().find((r) => r.id === runId);
    expect(run?.status).toBe('errored');

    // Now allow success
    shouldFail = false;

    await processor.retryPipelineRun(runId);

    // Wait for retry
    await new Promise((resolve) => setTimeout(resolve, 100));

    run = conn.db.select().from(pipelineRuns).all().find((r) => r.id === runId);
    expect(run?.status).toBe('processed');
  });
});
