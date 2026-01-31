import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { nowISO } from '@datahub/shared';
import type { AppDatabase } from '../db';
import { users } from '../db/schema';

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

export function usersRoutes(db: AppDatabase) {
  const app = new Hono();

  // List all users
  app.get('/', (c) => {
    const result = db.select().from(users).all();
    return c.json(result);
  });

  // Create user
  app.post('/', async (c) => {
    const body = await c.req.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid input', details: parsed.error.issues }, 400);
    }

    const id = crypto.randomUUID();
    const tokenId = crypto.randomUUID();

    const user = {
      id,
      name: parsed.data.name,
      email: parsed.data.email,
      tokenId,
      createdAt: nowISO(),
    };

    db.insert(users).values(user).run();

    return c.json(user, 201);
  });

  // Get user by ID
  app.get('/:id', (c) => {
    const id = c.req.param('id');
    const user = db.select().from(users).where(eq(users.id, id)).get();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(user);
  });

  // Update user
  app.patch('/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid input', details: parsed.error.issues }, 400);
    }

    const existing = db.select().from(users).where(eq(users.id, id)).get();
    if (!existing) {
      return c.json({ error: 'User not found' }, 404);
    }

    const updated = { ...existing, ...parsed.data };
    db.update(users).set(updated).where(eq(users.id, id)).run();

    return c.json(updated);
  });

  // Delete user
  app.delete('/:id', (c) => {
    const id = c.req.param('id');
    db.delete(users).where(eq(users.id, id)).run();
    return c.body(null, 204);
  });

  return app;
}
