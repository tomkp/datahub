import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { securityHeadersMiddleware } from './security-headers';

describe('securityHeadersMiddleware', () => {
  const app = new Hono();
  app.use('*', securityHeadersMiddleware());
  app.get('/test', (c) => c.text('ok'));

  it('sets X-Content-Type-Options header', async () => {
    const res = await app.request('/test');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('sets X-Frame-Options header', async () => {
    const res = await app.request('/test');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('sets X-XSS-Protection header', async () => {
    const res = await app.request('/test');
    expect(res.headers.get('X-XSS-Protection')).toBe('1; mode=block');
  });

  it('sets Strict-Transport-Security header', async () => {
    const res = await app.request('/test');
    expect(res.headers.get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains');
  });

  it('sets Referrer-Policy header', async () => {
    const res = await app.request('/test');
    expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });

  it('sets Content-Security-Policy header', async () => {
    const res = await app.request('/test');
    expect(res.headers.get('Content-Security-Policy')).toBe("default-src 'self'");
  });
});
