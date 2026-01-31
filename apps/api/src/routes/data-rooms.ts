import { Hono } from 'hono';
import { z } from 'zod';
import { eq, desc, asc, inArray } from 'drizzle-orm';
import { nowISO } from '@datahub/shared';
import type { AppDatabase } from '../db';
import { dataRooms, pipelines, pipelineRuns, fileVersions, files, folders } from '../db/schema';
import { CascadeDeletionService } from '../services/cascade-deletion';

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
    const now = nowISO();
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
      updatedAt: nowISO(),
    };

    db.update(dataRooms).set(updated).where(eq(dataRooms.id, id)).run();

    // If name changed, update root folder name to match
    if (parsed.data.name) {
      db.update(folders)
        .set({ name: parsed.data.name, updatedAt: nowISO() })
        .where(eq(folders.id, `${id}-root`))
        .run();
    }

    return c.json(updated);
  });

  // Delete data room
  app.delete('/:id', (c) => {
    const id = c.req.param('id');
    const cascadeService = new CascadeDeletionService(db);
    cascadeService.deleteDataRoom(id);
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

    // Enrich runs with file, folder, and version information
    const enrichedRuns = runs.map((run) => {
      const version = db.select().from(fileVersions).where(eq(fileVersions.id, run.fileVersionId)).get();
      if (version) {
        const file = db.select().from(files).where(eq(files.id, version.fileId)).get();
        const folder = file ? db.select().from(folders).where(eq(folders.id, file.folderId)).get() : null;

        // Get all versions for this file to calculate version number
        const allVersions = db
          .select()
          .from(fileVersions)
          .where(eq(fileVersions.fileId, version.fileId))
          .orderBy(asc(fileVersions.uploadedAt))
          .all();
        const versionIndex = allVersions.findIndex((v) => v.id === version.id);
        const versionNumber = versionIndex >= 0 ? versionIndex + 1 : 1;

        return {
          ...run,
          fileId: file?.id,
          fileName: file?.name,
          folderId: folder?.id,
          folderName: folder?.name,
          versionNumber,
          versionCount: allVersions.length,
        };
      }
      return run;
    });

    return c.json(enrichedRuns);
  });

  return app;
}
