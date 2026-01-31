import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v6';
import { ApiContext, type ApiClient } from '../lib/api';
import { DataRooms } from './DataRooms';

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
    list: vi.fn().mockResolvedValue([]),
    get: vi.fn(),
    create: vi.fn().mockResolvedValue({ id: 'dr1', name: 'Test Room' }),
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
});

const createWrapper = (api: ApiClient) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={['/data-rooms']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <NuqsAdapter>
        <ApiContext.Provider value={api}>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </ApiContext.Provider>
      </NuqsAdapter>
    </MemoryRouter>
  );
};

describe('DataRooms', () => {
  it('renders the data rooms page', async () => {
    const api = createMockApi();
    render(<DataRooms />, { wrapper: createWrapper(api) });

    expect(await screen.findByRole('heading', { level: 1, name: /data rooms/i })).toBeInTheDocument();
  });

  it('has a new data room button', async () => {
    const api = createMockApi();
    render(<DataRooms />, { wrapper: createWrapper(api) });

    expect(await screen.findByRole('button', { name: /new data room/i })).toBeInTheDocument();
  });

  describe('create modal state', () => {
    it('does not show create form initially', async () => {
      const api = createMockApi();
      render(<DataRooms />, { wrapper: createWrapper(api) });

      await screen.findByRole('heading', { level: 1, name: /data rooms/i });
      expect(screen.queryByPlaceholderText(/enter data room name/i)).not.toBeInTheDocument();
    });

    it('shows create form when new data room button is clicked', async () => {
      const api = createMockApi();
      render(<DataRooms />, { wrapper: createWrapper(api) });

      const button = await screen.findByRole('button', { name: /new data room/i });
      fireEvent.click(button);

      expect(await screen.findByPlaceholderText(/enter data room name/i)).toBeInTheDocument();
    });

    it('hides create form when cancel is clicked', async () => {
      const api = createMockApi();
      render(<DataRooms />, { wrapper: createWrapper(api) });

      const newButton = await screen.findByRole('button', { name: /new data room/i });
      fireEvent.click(newButton);

      const cancelButton = await screen.findByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(screen.queryByPlaceholderText(/enter data room name/i)).not.toBeInTheDocument();
    });

    it('has a create button that is disabled when name is empty', async () => {
      const api = createMockApi();
      render(<DataRooms />, { wrapper: createWrapper(api) });

      const newButton = await screen.findByRole('button', { name: /new data room/i });
      fireEvent.click(newButton);

      const createButton = await screen.findByRole('button', { name: /^create$/i });
      expect(createButton).toBeDisabled();
    });

    it('enables create button when name is entered', async () => {
      const api = createMockApi();
      render(<DataRooms />, { wrapper: createWrapper(api) });

      const newButton = await screen.findByRole('button', { name: /new data room/i });
      fireEvent.click(newButton);

      const input = await screen.findByPlaceholderText(/enter data room name/i);
      fireEvent.change(input, { target: { value: 'Test Room' } });

      const createButton = await screen.findByRole('button', { name: /^create$/i });
      expect(createButton).toBeEnabled();
    });
  });
});
