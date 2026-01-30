import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import type { AppDatabase } from '../db';
import { files, fileVersions } from '../db/schema';

export function filesRoutes(db: AppDatabase) {
  const app = new Hono();

  // List files in folder
  app.get('/folders/:folderId/files', (c) => {
    const folderId = c.req.param('folderId');
    const result = db.select().from(files).where(eq(files.folderId, folderId)).all();
    return c.json(result);
  });

  // Get file by ID (with versions)
  app.get('/files/:id', (c) => {
    const id = c.req.param('id');
    const file = db.select().from(files).where(eq(files.id, id)).get();

    if (!file) {
      return c.json({ error: 'File not found' }, 404);
    }

    const versions = db.select().from(fileVersions).where(eq(fileVersions.fileId, id)).all();

    return c.json({ ...file, versions });
  });

  // Delete file
  app.delete('/files/:id', (c) => {
    const id = c.req.param('id');
    // Delete versions first
    db.delete(fileVersions).where(eq(fileVersions.fileId, id)).run();
    db.delete(files).where(eq(files.id, id)).run();
    return c.body(null, 204);
  });

  // List file versions
  app.get('/files/:fileId/versions', (c) => {
    const fileId = c.req.param('fileId');
    const versions = db.select().from(fileVersions).where(eq(fileVersions.fileId, fileId)).all();
    return c.json(versions);
  });

  return app;
}
