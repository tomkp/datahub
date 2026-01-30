import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import type { AppDatabase } from '../db';
import { folders } from '../db/schema';

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
    db.delete(folders).where(eq(folders.id, id)).run();
    return c.body(null, 204);
  });

  return app;
}
