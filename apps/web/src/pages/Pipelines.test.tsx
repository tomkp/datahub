import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v6';
import { ApiContext, type ApiClient } from '../lib/api';
import { Pipelines } from './Pipelines';

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
});

const createWrapper = (api: ApiClient, initialEntries: string[] = ['/pipelines']) => {
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
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </ApiContext.Provider>
      </NuqsAdapter>
    </MemoryRouter>
  );
};

describe('Pipelines', () => {
  it('renders the pipelines page', async () => {
    const api = createMockApi();
    render(<Pipelines />, { wrapper: createWrapper(api) });

    expect(await screen.findByRole('heading', { level: 1, name: /pipelines/i })).toBeInTheDocument();
  });

  it('has a filter dropdown', async () => {
    const api = createMockApi();
    render(<Pipelines />, { wrapper: createWrapper(api) });

    expect(await screen.findByRole('combobox')).toBeInTheDocument();
  });

  describe('filter state management', () => {
    it('defaults filter to "all"', async () => {
      const api = createMockApi();
      render(<Pipelines />, { wrapper: createWrapper(api) });

      const select = await screen.findByRole('combobox');
      expect(select).toHaveValue('all');
    });

    it('can change filter to active', async () => {
      const api = createMockApi();
      render(<Pipelines />, { wrapper: createWrapper(api) });

      const select = await screen.findByRole('combobox');
      fireEvent.change(select, { target: { value: 'active' } });

      expect(select).toHaveValue('active');
    });

    it('can change filter to failed', async () => {
      const api = createMockApi();
      render(<Pipelines />, { wrapper: createWrapper(api) });

      const select = await screen.findByRole('combobox');
      fireEvent.change(select, { target: { value: 'failed' } });

      expect(select).toHaveValue('failed');
    });

    it('has all three filter options available', async () => {
      const api = createMockApi();
      render(<Pipelines />, { wrapper: createWrapper(api) });

      const select = await screen.findByRole('combobox');
      const options = select.querySelectorAll('option');

      expect(options).toHaveLength(3);
      expect(options[0]).toHaveValue('all');
      expect(options[1]).toHaveValue('active');
      expect(options[2]).toHaveValue('failed');
    });
  });
});
