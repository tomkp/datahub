import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { nowISO, formatDateForFilename } from './dates';

describe('dates utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-15T10:30:45.123Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('nowISO', () => {
    it('returns current timestamp in ISO format', () => {
      expect(nowISO()).toBe('2024-03-15T10:30:45.123Z');
    });
  });

  describe('formatDateForFilename', () => {
    it('formats date for filename use', () => {
      const date = new Date('2024-03-15T10:30:45.123Z');
      expect(formatDateForFilename(date)).toBe('2024-03-15');
    });

    it('uses current date when no date provided', () => {
      expect(formatDateForFilename()).toBe('2024-03-15');
    });
  });
});
