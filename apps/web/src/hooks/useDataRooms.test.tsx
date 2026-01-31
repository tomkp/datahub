import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useDataRooms, useDataRoom, useCreateDataRoom } from './useDataRooms';
import { ApiContext, type ApiClient } from '../lib/api';

const createMockApi = (overrides: Partial<ApiClient> = {}): ApiClient => ({
  baseUrl: 'http://localhost:3001',
  token: 'test-token',
  tenants: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  dataRooms: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getFolders: vi.fn(),
      getPipelineRuns: vi.fn(),
  },
  folders: {
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getFiles: vi.fn(),
  },
  files: {
    get: vi.fn(),
    upload: vi.fn(),
    uploadVersion: vi.fn(),
    delete: vi.fn(),
    getVersions: vi.fn(),
  },
  pipelines: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getRuns: vi.fn(),
  },
  pipelineRuns: {
    get: vi.fn(),
    getByFileVersion: vi.fn(),
    create: vi.fn(),
    retry: vi.fn(),
  },
  ...overrides,
});

const createWrapper = (api: ApiClient) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <ApiContext.Provider value={api}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ApiContext.Provider>
  );
};

describe('useDataRooms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches data rooms', async () => {
    const mockRooms = [
      { id: '1', name: 'Room 1', tenantId: 't1', storageUrl: '/s1' },
      { id: '2', name: 'Room 2', tenantId: 't1', storageUrl: '/s2' },
    ];

    const api = createMockApi({
      dataRooms: {
        ...createMockApi().dataRooms,
        list: vi.fn().mockResolvedValue(mockRooms),
      },
    });

    const { result } = renderHook(() => useDataRooms(), {
      wrapper: createWrapper(api),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockRooms);
  });

  it('handles loading state', () => {
    const api = createMockApi({
      dataRooms: {
        ...createMockApi().dataRooms,
        list: vi.fn().mockImplementation(() => new Promise(() => {})),
      },
    });

    const { result } = renderHook(() => useDataRooms(), {
      wrapper: createWrapper(api),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('handles error state', async () => {
    const api = createMockApi({
      dataRooms: {
        ...createMockApi().dataRooms,
        list: vi.fn().mockRejectedValue(new Error('Failed to fetch')),
      },
    });

    const { result } = renderHook(() => useDataRooms(), {
      wrapper: createWrapper(api),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Failed to fetch');
  });
});

describe('useDataRoom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches a single data room', async () => {
    const mockRoom = { id: '1', name: 'Room 1', tenantId: 't1', storageUrl: '/s1' };

    const api = createMockApi({
      dataRooms: {
        ...createMockApi().dataRooms,
        get: vi.fn().mockResolvedValue(mockRoom),
      },
    });

    const { result } = renderHook(() => useDataRoom('1'), {
      wrapper: createWrapper(api),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockRoom);
  });
});

describe('useCreateDataRoom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a data room', async () => {
    const newRoom = { id: '1', name: 'New Room', tenantId: 't1', storageUrl: '/s1' };
    const createFn = vi.fn().mockResolvedValue(newRoom);

    const api = createMockApi({
      dataRooms: {
        ...createMockApi().dataRooms,
        create: createFn,
      },
    });

    const { result } = renderHook(() => useCreateDataRoom(), {
      wrapper: createWrapper(api),
    });

    result.current.mutate({
      name: 'New Room',
      tenantId: 't1',
      storageUrl: '/s1',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(createFn).toHaveBeenCalledWith({
      name: 'New Room',
      tenantId: 't1',
      storageUrl: '/s1',
    });
    expect(result.current.data).toEqual(newRoom);
  });
});
