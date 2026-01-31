import { Hono } from 'hono';
import { eq, desc, inArray } from 'drizzle-orm';
import { nowISO } from '@datahub/shared';
import type { AppDatabase } from '../db';
import { files, fileVersions, folders, pipelineRuns, pipelineRunSteps, pipelines } from '../db/schema';
import { FileStorage } from '../services/storage';
import { getUser } from '../middleware/auth';
import { CascadeDeletionService } from '../services/cascade-deletion';

function validatePipelineForDataRoom(
  db: AppDatabase,
  pipelineId: string,
  dataRoomId: string
): boolean {
  const pipeline = db.select().from(pipelines).where(eq(pipelines.id, pipelineId)).get();
  return pipeline !== undefined && pipeline.dataRoomId === dataRoomId;
}

function triggerPipelineRun(
  db: AppDatabase,
  pipelineId: string,
  fileVersionId: string
): { id: string; pipelineId: string; fileVersionId: string; status: 'processing' } {
  const pipeline = db.select().from(pipelines).where(eq(pipelines.id, pipelineId)).get();
  if (!pipeline) {
    throw new Error('Pipeline not found');
  }

  const id = crypto.randomUUID();
  const now = nowISO();

  const run = {
    id,
    pipelineId,
    fileVersionId,
    status: 'processing' as const,
    createdAt: now,
    updatedAt: now,
  };
  db.insert(pipelineRuns).values(run).run();

  const steps = typeof pipeline.steps === 'string'
    ? JSON.parse(pipeline.steps)
    : pipeline.steps;

  for (const step of steps as string[]) {
    const stepId = crypto.randomUUID();
    db.insert(pipelineRunSteps).values({
      id: stepId,
      pipelineRunId: id,
      step,
      status: 'processing',
      createdAt: now,
      updatedAt: now,
    }).run();
  }

  return { id, pipelineId, fileVersionId, status: 'processing' };
}

export function filesRoutes(db: AppDatabase, storage: FileStorage) {
  const app = new Hono();

  // List files in folder (with latest version and pipeline status)
  app.get('/folders/:folderId/files', (c) => {
    const folderId = c.req.param('folderId');
    const fileList = db.select().from(files).where(eq(files.folderId, folderId)).all();

    // Get latest version for each file
    const fileIds = fileList.map((f) => f.id);
    if (fileIds.length === 0) {
      return c.json([]);
    }

    // Get all versions for these files
    const allVersions = db
      .select()
      .from(fileVersions)
      .where(inArray(fileVersions.fileId, fileIds))
      .orderBy(desc(fileVersions.uploadedAt))
      .all();

    // Group versions by fileId and get the latest + count
    const latestVersionByFile = new Map<string, typeof allVersions[0]>();
    const versionCountByFile = new Map<string, number>();
    for (const version of allVersions) {
      if (!latestVersionByFile.has(version.fileId)) {
        latestVersionByFile.set(version.fileId, version);
      }
      versionCountByFile.set(version.fileId, (versionCountByFile.get(version.fileId) || 0) + 1);
    }

    // Get pipeline runs for latest versions
    const latestVersionIds = Array.from(latestVersionByFile.values()).map((v) => v.id);
    const runs = latestVersionIds.length > 0
      ? db
          .select()
          .from(pipelineRuns)
          .where(inArray(pipelineRuns.fileVersionId, latestVersionIds))
          .all()
      : [];

    const runByVersionId = new Map(runs.map((r) => [r.fileVersionId, r]));

    // Get pipeline names for versions that have a pipelineId
    const pipelineIds = Array.from(latestVersionByFile.values())
      .map((v) => v.pipelineId)
      .filter((id): id is string => id !== null);
    const pipelineList = pipelineIds.length > 0
      ? db.select().from(pipelines).where(inArray(pipelines.id, pipelineIds)).all()
      : [];
    const pipelineById = new Map(pipelineList.map((p) => [p.id, p]));

    // Combine file data with latest version and pipeline status
    const result = fileList.map((file) => {
      const latestVersion = latestVersionByFile.get(file.id);
      const pipelineRun = latestVersion ? runByVersionId.get(latestVersion.id) : undefined;
      const pipeline = latestVersion?.pipelineId ? pipelineById.get(latestVersion.pipelineId) : undefined;
      return {
        ...file,
        latestVersion,
        versionCount: versionCountByFile.get(file.id) || 0,
        pipelineStatus: pipelineRun?.status,
        pipelineName: pipeline?.name,
      };
    });

    return c.json(result);
  });

  // Upload file to folder
  app.post('/folders/:folderId/files', async (c) => {
    const folderId = c.req.param('folderId');
    const user = getUser(c);

    // Get folder to find dataRoomId
    const folder = db.select().from(folders).where(eq(folders.id, folderId)).get();
    if (!folder) {
      return c.json({ error: 'Folder not found' }, 404);
    }

    const formData = await c.req.formData();
    const uploadedFile = formData.get('file');
    const pipelineId = formData.get('pipelineId') as string | null;

    if (!uploadedFile || !(uploadedFile instanceof File)) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Validate pipeline belongs to same data room (if provided)
    if (pipelineId && !validatePipelineForDataRoom(db, pipelineId, folder.dataRoomId)) {
      return c.json({ error: 'Invalid pipeline for this data room' }, 400);
    }

    const fileId = crypto.randomUUID();
    const versionId = crypto.randomUUID();
    const now = nowISO();

    // Save file to storage
    const content = Buffer.from(await uploadedFile.arrayBuffer());
    const storagePath = await storage.save(
      folder.dataRoomId,
      fileId,
      versionId,
      uploadedFile.name,
      content
    );

    // Create file record
    const file = {
      id: fileId,
      dataRoomId: folder.dataRoomId,
      folderId,
      name: uploadedFile.name,
      createdAt: now,
      updatedAt: now,
    };
    db.insert(files).values(file).run();

    // Create file version record with pipelineId
    const version = {
      id: versionId,
      fileId,
      pipelineId: pipelineId || null,
      storageUrl: storagePath,
      uploadedBy: user.id,
      uploadedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    db.insert(fileVersions).values(version).run();

    // Auto-trigger pipeline run if pipelineId provided
    let pipelineRun: ReturnType<typeof triggerPipelineRun> | undefined;
    if (pipelineId) {
      pipelineRun = triggerPipelineRun(db, pipelineId, versionId);
    }

    return c.json({ ...file, latestVersion: version, pipelineRun }, 201);
  });

  // Get file by ID (with versions)
  app.get('/files/:id', (c) => {
    const id = c.req.param('id');
    const file = db.select().from(files).where(eq(files.id, id)).get();

    if (!file) {
      return c.json({ error: 'File not found' }, 404);
    }

    const versions = db
      .select()
      .from(fileVersions)
      .where(eq(fileVersions.fileId, id))
      .orderBy(desc(fileVersions.uploadedAt))
      .all();

    return c.json({ ...file, versions });
  });

  // Upload new version
  app.post('/files/:fileId/versions', async (c) => {
    const fileId = c.req.param('fileId');
    const user = getUser(c);

    const file = db.select().from(files).where(eq(files.id, fileId)).get();
    if (!file) {
      return c.json({ error: 'File not found' }, 404);
    }

    const formData = await c.req.formData();
    const uploadedFile = formData.get('file');
    const pipelineId = formData.get('pipelineId') as string | null;

    if (!uploadedFile || !(uploadedFile instanceof File)) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Validate pipeline belongs to same data room (if provided)
    if (pipelineId && !validatePipelineForDataRoom(db, pipelineId, file.dataRoomId)) {
      return c.json({ error: 'Invalid pipeline for this data room' }, 400);
    }

    const versionId = crypto.randomUUID();
    const now = nowISO();

    // Save file to storage
    const content = Buffer.from(await uploadedFile.arrayBuffer());
    const storagePath = await storage.save(
      file.dataRoomId,
      fileId,
      versionId,
      uploadedFile.name,
      content
    );

    // Create file version record with pipelineId
    const version = {
      id: versionId,
      fileId,
      pipelineId: pipelineId || null,
      storageUrl: storagePath,
      uploadedBy: user.id,
      uploadedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    db.insert(fileVersions).values(version).run();

    // Update file timestamp
    db.update(files).set({ updatedAt: now }).where(eq(files.id, fileId)).run();

    // Auto-trigger pipeline run if pipelineId provided
    let pipelineRun: ReturnType<typeof triggerPipelineRun> | undefined;
    if (pipelineId) {
      pipelineRun = triggerPipelineRun(db, pipelineId, versionId);
    }

    return c.json({ ...version, pipelineRun }, 201);
  });

  // Delete file
  app.delete('/files/:id', (c) => {
    const id = c.req.param('id');
    const cascadeService = new CascadeDeletionService(db);
    cascadeService.deleteFile(id);
    return c.body(null, 204);
  });

  // List file versions (ordered by uploadedAt desc, latest first)
  app.get('/files/:fileId/versions', (c) => {
    const fileId = c.req.param('fileId');
    const versions = db
      .select()
      .from(fileVersions)
      .where(eq(fileVersions.fileId, fileId))
      .orderBy(desc(fileVersions.uploadedAt))
      .all();
    return c.json(versions);
  });

  // Download file version
  app.get('/file-versions/:id/download', async (c) => {
    const id = c.req.param('id');
    const version = db.select().from(fileVersions).where(eq(fileVersions.id, id)).get();

    if (!version) {
      return c.json({ error: 'File version not found' }, 404);
    }

    const content = await storage.read(version.storageUrl);

    // Extract filename from path
    const filename = version.storageUrl.split('/').pop() || 'download';

    return new Response(content, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': content.length.toString(),
      },
    });
  });

  return app;
}
