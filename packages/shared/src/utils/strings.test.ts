import { describe, it, expect } from 'vitest';
import { toSlug, extractBearerToken } from './strings';

describe('strings utils', () => {
  describe('toSlug', () => {
    it('converts string to lowercase slug', () => {
      expect(toSlug('Hello World')).toBe('hello-world');
    });

    it('handles multiple spaces', () => {
      expect(toSlug('Hello   World')).toBe('hello---world');
    });

    it('handles empty string', () => {
      expect(toSlug('')).toBe('');
    });

    it('handles already lowercased string', () => {
      expect(toSlug('hello-world')).toBe('hello-world');
    });
  });

  describe('extractBearerToken', () => {
    it('extracts token from Bearer header', () => {
      expect(extractBearerToken('Bearer abc123')).toBe('abc123');
    });

    it('returns null for non-Bearer header', () => {
      expect(extractBearerToken('Basic abc123')).toBeNull();
    });

    it('returns null for empty header', () => {
      expect(extractBearerToken('')).toBeNull();
    });

    it('returns null for undefined header', () => {
      expect(extractBearerToken(undefined)).toBeNull();
    });

    it('handles token with special characters', () => {
      expect(extractBearerToken('Bearer abc-123_xyz')).toBe('abc-123_xyz');
    });
  });
});
