import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { FileStorage } from './storage';

describe('FileStorage', () => {
  const testDir = '/tmp/datahub-test-storage';
  let storage: FileStorage;

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true });
    storage = new FileStorage(testDir);
  });

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('save', () => {
    it('saves a file and returns the path', async () => {
      const content = Buffer.from('test content');
      const result = await storage.save('room1', 'file1', 'v1', 'test.txt', content);

      expect(result).toBe(path.join(testDir, 'room1', 'file1', 'v1', 'test.txt'));

      const saved = await fs.readFile(result);
      expect(saved.toString()).toBe('test content');
    });

    it('creates nested directories', async () => {
      const content = Buffer.from('nested');
      const result = await storage.save('room2', 'file2', 'v1', 'nested.txt', content);

      const stat = await fs.stat(result);
      expect(stat.isFile()).toBe(true);
    });
  });

  describe('read', () => {
    it('reads a saved file', async () => {
      const content = Buffer.from('read test');
      const filePath = await storage.save('room3', 'file3', 'v1', 'read.txt', content);

      const result = await storage.read(filePath);
      expect(result.toString()).toBe('read test');
    });
  });

  describe('delete', () => {
    it('deletes a file', async () => {
      const content = Buffer.from('delete test');
      const filePath = await storage.save('room4', 'file4', 'v1', 'delete.txt', content);

      await storage.delete(filePath);

      await expect(fs.access(filePath)).rejects.toThrow();
    });
  });
});
