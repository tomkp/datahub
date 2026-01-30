import { serve } from '@hono/node-server';
import { app } from './app';

const port = parseInt(process.env.PORT || '3001', 10);
if (isNaN(port) || port <= 0) {
  console.error('Invalid PORT environment variable');
  process.exit(1);
}

console.log(`Starting server on port ${port}...`);

const server = serve({
  fetch: app.fetch,
  port,
});

console.log(`Server running at http://localhost:${port}`);

const shutdown = () => {
  console.log('Shutting down gracefully...');
  server.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
