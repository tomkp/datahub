import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v6';
import { ApiContext, type ApiClient } from '../lib/api';
import { ToastProvider } from '../components/ui/Toast';
import { DataRoomDetail } from './DataRoomDetail';

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
    get: vi.fn().mockResolvedValue({ id: 'dr1', name: 'Test Data Room' }),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getFolders: vi.fn().mockResolvedValue([]),
    getPipelineRuns: vi.fn(),
  },
  folders: {
    get: vi.fn(),
    create: vi.fn().mockResolvedValue({ id: 'f1', name: 'New Folder' }),
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

const createWrapper = (api: ApiClient, initialEntries: string[] = ['/data-rooms/dr1']) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <NuqsAdapter>
        <ApiContext.Provider value={api}>
          <QueryClientProvider client={queryClient}>
            <ToastProvider>
              <Routes>
                <Route path="/data-rooms/:id" element={children} />
              </Routes>
            </ToastProvider>
          </QueryClientProvider>
        </ApiContext.Provider>
      </NuqsAdapter>
    </MemoryRouter>
  );
};

describe('DataRoomDetail', () => {
  it('renders the data room name', async () => {
    const api = createMockApi();
    render(<DataRoomDetail />, { wrapper: createWrapper(api) });

    expect(await screen.findByRole('heading', { level: 1, name: /test data room/i })).toBeInTheDocument();
  });

  it('has a new folder button', async () => {
    const api = createMockApi();
    render(<DataRoomDetail />, { wrapper: createWrapper(api) });

    expect(await screen.findByRole('button', { name: /new folder/i })).toBeInTheDocument();
  });

  describe('create folder modal state', () => {
    it('does not show create folder form initially', async () => {
      const api = createMockApi();
      render(<DataRoomDetail />, { wrapper: createWrapper(api) });

      await screen.findByRole('heading', { level: 1, name: /test data room/i });
      expect(screen.queryByPlaceholderText(/enter folder name/i)).not.toBeInTheDocument();
    });

    it('shows create folder form when new folder button is clicked', async () => {
      const api = createMockApi();
      render(<DataRoomDetail />, { wrapper: createWrapper(api) });

      const button = await screen.findByRole('button', { name: /new folder/i });
      fireEvent.click(button);

      expect(await screen.findByPlaceholderText(/enter folder name/i)).toBeInTheDocument();
    });

    it('hides create folder form when cancel is clicked', async () => {
      const api = createMockApi();
      render(<DataRoomDetail />, { wrapper: createWrapper(api) });

      const newButton = await screen.findByRole('button', { name: /new folder/i });
      fireEvent.click(newButton);

      const cancelButton = await screen.findByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(screen.queryByPlaceholderText(/enter folder name/i)).not.toBeInTheDocument();
    });

    it('has a create button that is disabled when name is empty', async () => {
      const api = createMockApi();
      render(<DataRoomDetail />, { wrapper: createWrapper(api) });

      const newButton = await screen.findByRole('button', { name: /new folder/i });
      fireEvent.click(newButton);

      const createButton = await screen.findByRole('button', { name: /^create$/i });
      expect(createButton).toBeDisabled();
    });

    it('enables create button when name is entered', async () => {
      const api = createMockApi();
      render(<DataRoomDetail />, { wrapper: createWrapper(api) });

      const newButton = await screen.findByRole('button', { name: /new folder/i });
      fireEvent.click(newButton);

      const input = await screen.findByPlaceholderText(/enter folder name/i);
      fireEvent.change(input, { target: { value: 'Test Folder' } });

      const createButton = await screen.findByRole('button', { name: /^create$/i });
      expect(createButton).toBeEnabled();
    });
  });
});
