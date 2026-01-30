import { serve } from '@hono/node-server';
import { app } from './app';

const port = Number(process.env.PORT) || 3001;

console.log(`Starting server on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`Server running at http://localhost:${port}`);
