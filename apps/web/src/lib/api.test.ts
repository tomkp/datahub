import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createApiClient, ApiClient } from './api';

describe('ApiClient', () => {
  let api: ApiClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    api = createApiClient('http://localhost:3001', 'test-token');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('tenants', () => {
    it('lists tenants', async () => {
      const tenants = [{ id: '1', name: 'Test Tenant' }];
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(tenants),
      });

      const result = await api.tenants.list();

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/api/tenants',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
      expect(result).toEqual(tenants);
    });

    it('creates a tenant', async () => {
      const tenant = { id: '1', name: 'New Tenant' };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(tenant),
      });

      const result = await api.tenants.create({ name: 'New Tenant' });

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/api/tenants',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'New Tenant' }),
        })
      );
      expect(result).toEqual(tenant);
    });

    it('gets a tenant by id', async () => {
      const tenant = { id: '1', name: 'Test Tenant' };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(tenant),
      });

      const result = await api.tenants.get('1');

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/api/tenants/1',
        expect.anything()
      );
      expect(result).toEqual(tenant);
    });

    it('deletes a tenant', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(undefined),
      });

      await api.tenants.delete('1');

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/api/tenants/1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('dataRooms', () => {
    it('lists data rooms', async () => {
      const rooms = [{ id: '1', name: 'Room 1', tenantId: 't1' }];
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rooms),
      });

      const result = await api.dataRooms.list();

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/api/data-rooms',
        expect.anything()
      );
      expect(result).toEqual(rooms);
    });

    it('creates a data room', async () => {
      const room = { id: '1', name: 'New Room', tenantId: 't1' };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(room),
      });

      const result = await api.dataRooms.create({
        name: 'New Room',
        tenantId: 't1',
        storageUrl: '/storage',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/api/data-rooms',
        expect.objectContaining({ method: 'POST' })
      );
      expect(result).toEqual(room);
    });

    it('gets folders for a data room', async () => {
      const folders = [{ id: 'f1', name: 'Folder 1', dataRoomId: 'r1' }];
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(folders),
      });

      const result = await api.dataRooms.getFolders('r1');

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/api/data-rooms/r1/folders',
        expect.anything()
      );
      expect(result).toEqual(folders);
    });
  });

  describe('folders', () => {
    it('creates a folder', async () => {
      const folder = { id: 'f1', name: 'New Folder', dataRoomId: 'r1' };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(folder),
      });

      const result = await api.folders.create('r1', { name: 'New Folder' });

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/api/data-rooms/r1/folders',
        expect.objectContaining({ method: 'POST' })
      );
      expect(result).toEqual(folder);
    });

    it('gets files in a folder', async () => {
      const files = [{ id: 'file1', name: 'test.txt', folderId: 'f1' }];
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(files),
      });

      const result = await api.folders.getFiles('f1');

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/api/folders/f1/files',
        expect.anything()
      );
      expect(result).toEqual(files);
    });
  });

  describe('files', () => {
    it('uploads a file', async () => {
      const file = { id: 'file1', name: 'test.txt' };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(file),
      });

      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      const result = await api.files.upload('f1', mockFile);

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/api/folders/f1/files',
        expect.objectContaining({ method: 'POST' })
      );
      expect(result).toEqual(file);
    });

    it('gets file with versions', async () => {
      const file = { id: 'file1', name: 'test.txt', versions: [] };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(file),
      });

      const result = await api.files.get('file1');

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/api/files/file1',
        expect.anything()
      );
      expect(result).toEqual(file);
    });

    it('deletes a file', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(undefined),
      });

      await api.files.delete('file1');

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/api/files/file1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('pipelines', () => {
    it('lists pipelines for a data room', async () => {
      const pipelines = [{ id: 'p1', name: 'Pipeline 1' }];
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(pipelines),
      });

      const result = await api.pipelines.list('r1');

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/api/data-rooms/r1/pipelines',
        expect.anything()
      );
      expect(result).toEqual(pipelines);
    });

    it('gets pipeline runs', async () => {
      const runs = [{ id: 'run1', pipelineId: 'p1', status: 'processing' }];
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(runs),
      });

      const result = await api.pipelines.getRuns('p1');

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/api/pipelines/p1/runs',
        expect.anything()
      );
      expect(result).toEqual(runs);
    });
  });

  describe('error handling', () => {
    it('throws on non-ok response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' }),
      });

      await expect(api.tenants.get('nonexistent')).rejects.toThrow('Not found');
    });
  });
});
