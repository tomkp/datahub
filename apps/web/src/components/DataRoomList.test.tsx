import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ApiContext, type ApiClient } from '../lib/api';
import { DataRoomList } from './DataRoomList';

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
    <BrowserRouter>
      <ApiContext.Provider value={api}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ApiContext.Provider>
    </BrowserRouter>
  );
};

describe('DataRoomList', () => {
  it('renders loading skeleton initially', () => {
    const api = createMockApi();
    api.dataRooms.list = vi.fn().mockImplementation(() => new Promise(() => {}));

    render(<DataRoomList />, { wrapper: createWrapper(api) });

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('renders data rooms when loaded', async () => {
    const api = createMockApi();
    api.dataRooms.list = vi.fn().mockResolvedValue([
      { id: '1', name: 'Room 1', tenantId: 't1', storageUrl: '/s1' },
      { id: '2', name: 'Room 2', tenantId: 't2', storageUrl: '/s2' },
    ]);

    render(<DataRoomList />, { wrapper: createWrapper(api) });

    expect(await screen.findByText('Room 1')).toBeInTheDocument();
    expect(await screen.findByText('Room 2')).toBeInTheDocument();
  });

  it('renders empty state when no data rooms', async () => {
    const api = createMockApi();
    api.dataRooms.list = vi.fn().mockResolvedValue([]);

    render(<DataRoomList />, { wrapper: createWrapper(api) });

    expect(await screen.findByText(/no data rooms/i)).toBeInTheDocument();
  });

  it('renders error state on failure', async () => {
    const api = createMockApi();
    api.dataRooms.list = vi.fn().mockRejectedValue(new Error('Failed to load'));

    render(<DataRoomList />, { wrapper: createWrapper(api) });

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Failed to load data rooms')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
