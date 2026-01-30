import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiContext, type ApiClient } from '../lib/api';
import { useTenants, useTenant } from './useTenants';

const createMockApi = (): ApiClient => ({
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
});

const createWrapper = (api: ApiClient) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <ApiContext.Provider value={api}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ApiContext.Provider>
  );
};

describe('useTenants', () => {
  it('fetches tenants list', async () => {
    const mockTenants = [
      { id: 't1', name: 'Tenant 1' },
      { id: 't2', name: 'Tenant 2' },
    ];
    const api = createMockApi();
    api.tenants.list = vi.fn().mockResolvedValue(mockTenants);

    const { result } = renderHook(() => useTenants(), {
      wrapper: createWrapper(api),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockTenants);
  });

  it('returns loading state initially', () => {
    const api = createMockApi();
    api.tenants.list = vi.fn().mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useTenants(), {
      wrapper: createWrapper(api),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('handles error state', async () => {
    const api = createMockApi();
    api.tenants.list = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

    const { result } = renderHook(() => useTenants(), {
      wrapper: createWrapper(api),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useTenant', () => {
  it('fetches single tenant', async () => {
    const mockTenant = { id: 't1', name: 'Tenant 1' };
    const api = createMockApi();
    api.tenants.get = vi.fn().mockResolvedValue(mockTenant);

    const { result } = renderHook(() => useTenant('t1'), {
      wrapper: createWrapper(api),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockTenant);
  });

  it('does not fetch when id is empty', () => {
    const api = createMockApi();

    const { result } = renderHook(() => useTenant(''), {
      wrapper: createWrapper(api),
    });

    expect(api.tenants.get).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });
});
