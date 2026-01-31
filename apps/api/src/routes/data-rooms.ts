import { Hono } from 'hono';
import { z } from 'zod';
import { eq, desc, inArray } from 'drizzle-orm';
import type { AppDatabase } from '../db';
import { dataRooms, pipelines, pipelineRuns, pipelineRunSteps, pipelineRunExpectedEvents, fileVersions, files, folders } from '../db/schema';

const createDataRoomSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  publicUrl: z.string().optional(),
  featureFlags: z.record(z.boolean()).optional(),
});

const updateDataRoomSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  publicUrl: z.string().optional(),
  featureFlags: z.record(z.boolean()).optional(),
});

export function dataRoomsRoutes(db: AppDatabase) {
  const app = new Hono();

  // List data rooms (optionally filtered by tenantId)
  app.get('/', (c) => {
    const tenantId = c.req.query('tenantId');

    if (tenantId) {
      const result = db.select().from(dataRooms).where(eq(dataRooms.tenantId, tenantId)).all();
      return c.json(result);
    }

    const result = db.select().from(dataRooms).all();
    return c.json(result);
  });

  // Create data room
  app.post('/', async (c) => {
    const body = await c.req.json();
    const parsed = createDataRoomSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid input', details: parsed.error.issues }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const storageUrl = `/data/uploads/${id}`;

    const dataRoom = {
      id,
      tenantId: parsed.data.tenantId,
      name: parsed.data.name,
      storageUrl,
      publicUrl: parsed.data.publicUrl,
      description: parsed.data.description,
      featureFlags: parsed.data.featureFlags,
      createdAt: now,
      updatedAt: now,
    };

    db.insert(dataRooms).values(dataRoom).run();

    // Create root folder with the same name as the data room
    const rootFolder = {
      id: `${id}-root`,
      dataRoomId: id,
      parentId: null,
      name: parsed.data.name,
      path: '/',
      createdAt: now,
      updatedAt: now,
    };
    db.insert(folders).values(rootFolder).run();

    return c.json(dataRoom, 201);
  });

  // Get data room by ID
  app.get('/:id', (c) => {
    const id = c.req.param('id');
    const dataRoom = db.select().from(dataRooms).where(eq(dataRooms.id, id)).get();

    if (!dataRoom) {
      return c.json({ error: 'Data room not found' }, 404);
    }

    return c.json(dataRoom);
  });

  // Update data room
  app.patch('/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const parsed = updateDataRoomSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid input', details: parsed.error.issues }, 400);
    }

    const existing = db.select().from(dataRooms).where(eq(dataRooms.id, id)).get();
    if (!existing) {
      return c.json({ error: 'Data room not found' }, 404);
    }

    const updated = {
      ...existing,
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    };

    db.update(dataRooms).set(updated).where(eq(dataRooms.id, id)).run();

    // If name changed, update root folder name to match
    if (parsed.data.name) {
      db.update(folders)
        .set({ name: parsed.data.name, updatedAt: new Date().toISOString() })
        .where(eq(folders.id, `${id}-root`))
        .run();
    }

    return c.json(updated);
  });

  // Delete data room
  app.delete('/:id', (c) => {
    const id = c.req.param('id');

    // Get all files in this data room
    const roomFiles = db.select().from(files).where(eq(files.dataRoomId, id)).all();
    const fileIds = roomFiles.map(f => f.id);

    if (fileIds.length > 0) {
      // Get all versions for these files
      const versions = db.select().from(fileVersions).where(inArray(fileVersions.fileId, fileIds)).all();
      const versionIds = versions.map(v => v.id);

      if (versionIds.length > 0) {
        // Get all pipeline runs for these versions
        const runs = db.select().from(pipelineRuns).where(inArray(pipelineRuns.fileVersionId, versionIds)).all();
        const runIds = runs.map(r => r.id);

        // Delete pipeline run steps and expected events
        if (runIds.length > 0) {
          db.delete(pipelineRunExpectedEvents).where(inArray(pipelineRunExpectedEvents.pipelineRunId, runIds)).run();
          db.delete(pipelineRunSteps).where(inArray(pipelineRunSteps.pipelineRunId, runIds)).run();
        }

        // Delete pipeline runs
        db.delete(pipelineRuns).where(inArray(pipelineRuns.fileVersionId, versionIds)).run();
      }

      // Delete file versions
      db.delete(fileVersions).where(inArray(fileVersions.fileId, fileIds)).run();

      // Delete files
      db.delete(files).where(eq(files.dataRoomId, id)).run();
    }

    // Delete folders
    db.delete(folders).where(eq(folders.dataRoomId, id)).run();

    // Delete pipelines
    db.delete(pipelines).where(eq(pipelines.dataRoomId, id)).run();

    // Delete data room
    db.delete(dataRooms).where(eq(dataRooms.id, id)).run();
    return c.body(null, 204);
  });

  // Get pipeline runs for a data room (across all pipelines)
  app.get('/:id/pipeline-runs', (c) => {
    const id = c.req.param('id');
    const limitParam = c.req.query('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    // Check data room exists
    const dataRoom = db.select().from(dataRooms).where(eq(dataRooms.id, id)).get();
    if (!dataRoom) {
      return c.json({ error: 'Data room not found' }, 404);
    }

    // Get all pipelines for this data room
    const roomPipelines = db.select().from(pipelines).where(eq(pipelines.dataRoomId, id)).all();
    if (roomPipelines.length === 0) {
      return c.json([]);
    }

    const pipelineIds = roomPipelines.map((p) => p.id);

    // Get pipeline runs for all pipelines, sorted by createdAt desc
    const runs = db
      .select()
      .from(pipelineRuns)
      .where(inArray(pipelineRuns.pipelineId, pipelineIds))
      .orderBy(desc(pipelineRuns.createdAt))
      .limit(limit)
      .all();

    // Enrich runs with file and folder information
    const enrichedRuns = runs.map((run) => {
      const version = db.select().from(fileVersions).where(eq(fileVersions.id, run.fileVersionId)).get();
      if (version) {
        const file = db.select().from(files).where(eq(files.id, version.fileId)).get();
        const folder = file ? db.select().from(folders).where(eq(folders.id, file.folderId)).get() : null;
        return {
          ...run,
          fileId: file?.id,
          fileName: file?.name,
          folderId: folder?.id,
          folderName: folder?.name,
        };
      }
      return run;
    });

    return c.json(enrichedRuns);
  });

  return app;
}
