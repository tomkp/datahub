import { Hono } from 'hono';
import { z } from 'zod';
import { eq, inArray } from 'drizzle-orm';
import type { AppDatabase } from '../db';
import { folders, files, fileVersions, pipelineRuns, pipelineRunSteps, pipelineRunExpectedEvents } from '../db/schema';

// Helper to collect all descendant folder IDs recursively
function collectFolderIds(db: AppDatabase, folderId: string): string[] {
  const result: string[] = [folderId];
  const children = db.select().from(folders).where(eq(folders.parentId, folderId)).all();
  for (const child of children) {
    result.push(...collectFolderIds(db, child.id));
  }
  return result;
}

const createFolderSchema = z.object({
  name: z.string().min(1),
  parentId: z.string().nullable().optional(),
});

const updateFolderSchema = z.object({
  name: z.string().min(1).optional(),
  parentId: z.string().nullable().optional(),
});

export function foldersRoutes(db: AppDatabase) {
  const app = new Hono();

  // List folders for a data room
  app.get('/data-rooms/:roomId/folders', (c) => {
    const roomId = c.req.param('roomId');
    const result = db.select().from(folders).where(eq(folders.dataRoomId, roomId)).all();
    return c.json(result);
  });

  // Create folder in data room
  app.post('/data-rooms/:roomId/folders', async (c) => {
    const roomId = c.req.param('roomId');
    const body = await c.req.json();
    const parsed = createFolderSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid input', details: parsed.error.issues }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Build path
    let path = parsed.data.name.toLowerCase().replace(/\s+/g, '_');
    if (parsed.data.parentId) {
      const parent = db.select().from(folders).where(eq(folders.id, parsed.data.parentId)).get();
      if (parent) {
        path = `${parent.path}.${path}`;
      }
    }

    const folder = {
      id,
      dataRoomId: roomId,
      parentId: parsed.data.parentId ?? null,
      name: parsed.data.name,
      path,
      createdAt: now,
      updatedAt: now,
    };

    db.insert(folders).values(folder).run();

    return c.json(folder, 201);
  });

  // Get folder by ID
  app.get('/folders/:id', (c) => {
    const id = c.req.param('id');
    const folder = db.select().from(folders).where(eq(folders.id, id)).get();

    if (!folder) {
      return c.json({ error: 'Folder not found' }, 404);
    }

    return c.json(folder);
  });

  // Update folder
  app.patch('/folders/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const parsed = updateFolderSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid input', details: parsed.error.issues }, 400);
    }

    const existing = db.select().from(folders).where(eq(folders.id, id)).get();
    if (!existing) {
      return c.json({ error: 'Folder not found' }, 404);
    }

    const updated = {
      ...existing,
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    };

    db.update(folders).set(updated).where(eq(folders.id, id)).run();

    return c.json(updated);
  });

  // Delete folder
  app.delete('/folders/:id', (c) => {
    const id = c.req.param('id');

    // Collect all folder IDs (including descendants)
    const folderIds = collectFolderIds(db, id);

    // Get all files in these folders
    const folderFiles = db.select().from(files).where(inArray(files.folderId, folderIds)).all();
    const fileIds = folderFiles.map(f => f.id);

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
      db.delete(files).where(inArray(files.folderId, folderIds)).run();
    }

    // Delete all folders (in reverse order to respect hierarchy)
    db.delete(folders).where(inArray(folders.id, folderIds)).run();

    return c.body(null, 204);
  });

  return app;
}
