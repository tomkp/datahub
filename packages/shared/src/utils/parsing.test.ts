import { describe, it, expect } from 'vitest';
import { parseJsonOrDefault, parseJsonArray } from './parsing';

describe('parsing utils', () => {
  describe('parseJsonOrDefault', () => {
    it('parses valid JSON string', () => {
      expect(parseJsonOrDefault('{"key": "value"}', {})).toEqual({ key: 'value' });
    });

    it('returns default for invalid JSON', () => {
      expect(parseJsonOrDefault('invalid', { fallback: true })).toEqual({ fallback: true });
    });

    it('returns default for null', () => {
      expect(parseJsonOrDefault(null, [])).toEqual([]);
    });

    it('returns default for undefined', () => {
      expect(parseJsonOrDefault(undefined, 'default')).toBe('default');
    });

    it('handles already parsed objects', () => {
      const obj = { already: 'parsed' };
      expect(parseJsonOrDefault(obj, {})).toEqual({ already: 'parsed' });
    });
  });

  describe('parseJsonArray', () => {
    it('parses valid JSON array string', () => {
      expect(parseJsonArray('[1, 2, 3]')).toEqual([1, 2, 3]);
    });

    it('returns empty array for invalid JSON', () => {
      expect(parseJsonArray('invalid')).toEqual([]);
    });

    it('returns empty array for null', () => {
      expect(parseJsonArray(null)).toEqual([]);
    });

    it('returns the array if already an array', () => {
      const arr = [1, 2, 3];
      expect(parseJsonArray(arr)).toEqual([1, 2, 3]);
    });

    it('returns empty array for non-array JSON', () => {
      expect(parseJsonArray('{"key": "value"}')).toEqual([]);
    });
  });
});
