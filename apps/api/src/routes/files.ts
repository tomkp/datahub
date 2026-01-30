import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import type { AppDatabase } from '../db';
import { files, fileVersions, folders } from '../db/schema';
import { FileStorage } from '../services/storage';
import { getUser } from '../middleware/auth';

export function filesRoutes(db: AppDatabase, storage: FileStorage) {
  const app = new Hono();

  // List files in folder
  app.get('/folders/:folderId/files', (c) => {
    const folderId = c.req.param('folderId');
    const result = db.select().from(files).where(eq(files.folderId, folderId)).all();
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

    if (!uploadedFile || !(uploadedFile instanceof File)) {
      return c.json({ error: 'No file provided' }, 400);
    }

    const fileId = crypto.randomUUID();
    const versionId = crypto.randomUUID();
    const now = new Date().toISOString();

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

    // Create file version record
    const version = {
      id: versionId,
      fileId,
      storageUrl: storagePath,
      uploadedBy: user.id,
      uploadedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    db.insert(fileVersions).values(version).run();

    return c.json({ ...file, latestVersion: version }, 201);
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

    if (!uploadedFile || !(uploadedFile instanceof File)) {
      return c.json({ error: 'No file provided' }, 400);
    }

    const versionId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Save file to storage
    const content = Buffer.from(await uploadedFile.arrayBuffer());
    const storagePath = await storage.save(
      file.dataRoomId,
      fileId,
      versionId,
      uploadedFile.name,
      content
    );

    // Create file version record
    const version = {
      id: versionId,
      fileId,
      storageUrl: storagePath,
      uploadedBy: user.id,
      uploadedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    db.insert(fileVersions).values(version).run();

    // Update file timestamp
    db.update(files).set({ updatedAt: now }).where(eq(files.id, fileId)).run();

    return c.json(version, 201);
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
