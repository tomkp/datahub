import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import type { AppDatabase } from '../db';
import { tenants } from '../db/schema';

const createTenantSchema = z.object({
  name: z.string().min(1),
});

const updateTenantSchema = z.object({
  name: z.string().min(1).optional(),
});

export function tenantsRoutes(db: AppDatabase) {
  const app = new Hono();

  // List all tenants
  app.get('/', (c) => {
    const result = db.select().from(tenants).all();
    return c.json(result);
  });

  // Create tenant
  app.post('/', async (c) => {
    const body = await c.req.json();
    const parsed = createTenantSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid input', details: parsed.error.issues }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const tenant = {
      id,
      name: parsed.data.name,
      createdAt: now,
      updatedAt: now,
    };

    db.insert(tenants).values(tenant).run();

    return c.json(tenant, 201);
  });

  // Get tenant by ID
  app.get('/:id', (c) => {
    const id = c.req.param('id');
    const tenant = db.select().from(tenants).where(eq(tenants.id, id)).get();

    if (!tenant) {
      return c.json({ error: 'Tenant not found' }, 404);
    }

    return c.json(tenant);
  });

  // Update tenant
  app.patch('/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const parsed = updateTenantSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid input', details: parsed.error.issues }, 400);
    }

    const existing = db.select().from(tenants).where(eq(tenants.id, id)).get();
    if (!existing) {
      return c.json({ error: 'Tenant not found' }, 404);
    }

    const updated = {
      ...existing,
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    };

    db.update(tenants).set(updated).where(eq(tenants.id, id)).run();

    return c.json(updated);
  });

  // Delete tenant
  app.delete('/:id', (c) => {
    const id = c.req.param('id');
    db.delete(tenants).where(eq(tenants.id, id)).run();
    return c.body(null, 204);
  });

  return app;
}
