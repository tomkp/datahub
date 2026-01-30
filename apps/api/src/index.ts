import { serve } from '@hono/node-server';
import { createApp } from './app';
import { createDb } from './db';
import { FileStorage } from './services/storage';

const port = parseInt(process.env.PORT || '3001', 10);
if (isNaN(port) || port <= 0) {
  console.error('Invalid PORT environment variable');
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL || './data/datahub.db';
const storagePath = process.env.STORAGE_PATH || './data/uploads';

console.log(`Connecting to database at ${dbUrl}...`);
console.log(`Using storage path: ${storagePath}`);

const { db, close } = createDb(dbUrl);
const storage = new FileStorage(storagePath);
const app = createApp({ db, storage });

console.log(`Starting server on port ${port}...`);

const server = serve({
  fetch: app.fetch,
  port,
});

console.log(`Server running at http://localhost:${port}`);

const shutdown = () => {
  console.log('Shutting down gracefully...');
  server.close();
  close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
