import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ApiContext, type ApiClient } from '../lib/api';
import { FileList } from './FileList';

const createMockApi = (): ApiClient => ({
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

describe('FileList', () => {
  it('renders files in a folder', async () => {
    const api = createMockApi();
    api.folders.getFiles = vi.fn().mockResolvedValue([
      { id: 'file1', name: 'report.pdf', folderId: 'f1', dataRoomId: 'r1' },
      { id: 'file2', name: 'data.csv', folderId: 'f1', dataRoomId: 'r1' },
    ]);

    render(<FileList folderId="f1" />, { wrapper: createWrapper(api) });

    expect(await screen.findByText('report.pdf')).toBeInTheDocument();
    expect(await screen.findByText('data.csv')).toBeInTheDocument();
  });

  it('renders loading skeleton', () => {
    const api = createMockApi();
    api.folders.getFiles = vi.fn().mockImplementation(() => new Promise(() => {}));

    render(<FileList folderId="f1" />, { wrapper: createWrapper(api) });

    expect(screen.getByTestId('file-loading')).toBeInTheDocument();
  });

  it('renders empty state when no files', async () => {
    const api = createMockApi();
    api.folders.getFiles = vi.fn().mockResolvedValue([]);

    render(<FileList folderId="f1" />, { wrapper: createWrapper(api) });

    expect(await screen.findByText(/no files/i)).toBeInTheDocument();
  });

  it('does not render when folderId is empty', () => {
    const api = createMockApi();

    render(<FileList folderId="" />, { wrapper: createWrapper(api) });

    expect(screen.queryByTestId('file-list')).not.toBeInTheDocument();
  });
});
