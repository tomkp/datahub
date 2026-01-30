import { describe, it, expect } from 'vitest';
import { app } from './app';

describe('API', () => {
  describe('GET /health', () => {
    it('returns ok status', async () => {
      const res = await app.request('/health');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toEqual({ status: 'ok' });
    });
  });
});
