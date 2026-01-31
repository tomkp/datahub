import type { MiddlewareHandler } from 'hono';

/**
 * Security headers middleware that adds common security headers to responses.
 */
export function securityHeadersMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    await next();

    // Prevent MIME type sniffing
    c.res.headers.set('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking
    c.res.headers.set('X-Frame-Options', 'DENY');

    // XSS protection (legacy, but still useful for older browsers)
    c.res.headers.set('X-XSS-Protection', '1; mode=block');

    // HTTPS enforcement (1 year)
    c.res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    // Control referrer information
    c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Content Security Policy - basic policy for API
    c.res.headers.set('Content-Security-Policy', "default-src 'self'");
  };
}
