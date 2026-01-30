import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { AppDatabase } from './db';
import { authMiddleware, getUser } from './middleware/auth';
import {
  tenantsRoutes,
  usersRoutes,
  dataRoomsRoutes,
  foldersRoutes,
  filesRoutes,
  pipelinesRoutes,
} from './routes';

// Simple app for testing without DB
export const app = new Hono();

app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

// Full app factory with DB injection
export function createApp(db: AppDatabase) {
  const app = new Hono();

  // Middleware
  app.use('*', cors());

  // Health check (public)
  app.get('/health', (c) => c.json({ status: 'ok' }));

  // Auth routes (public)
  app.get('/api/auth/me', authMiddleware(db), (c) => {
    const user = getUser(c);
    return c.json(user);
  });

  // Protected routes
  const api = new Hono();
  api.use('*', authMiddleware(db));

  // Mount routes
  api.route('/tenants', tenantsRoutes(db));
  api.route('/users', usersRoutes(db));
  api.route('/data-rooms', dataRoomsRoutes(db));
  api.route('/', foldersRoutes(db));
  api.route('/', filesRoutes(db));
  api.route('/', pipelinesRoutes(db));

  app.route('/api', api);

  return app;
}
