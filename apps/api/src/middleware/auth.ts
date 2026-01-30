import { Context, MiddlewareHandler } from 'hono';
import { eq } from 'drizzle-orm';
import type { AppDatabase } from '../db';
import { users } from '../db/schema';

type User = {
  id: string;
  name: string;
  email: string;
  tokenId: string;
};

const USER_KEY = 'user';

export function authMiddleware(db: AppDatabase): MiddlewareHandler {
  return async (c, next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.slice(7);

    const user = db
      .select()
      .from(users)
      .where(eq(users.tokenId, token))
      .get();

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    c.set(USER_KEY, user);
    await next();
  };
}

export function getUser(c: Context): User {
  return c.get(USER_KEY) as User;
}

export function optionalAuthMiddleware(db: AppDatabase): MiddlewareHandler {
  return async (c, next) => {
    const authHeader = c.req.header('Authorization');

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const user = db
        .select()
        .from(users)
        .where(eq(users.tokenId, token))
        .get();

      if (user) {
        c.set(USER_KEY, user);
      }
    }

    await next();
  };
}
