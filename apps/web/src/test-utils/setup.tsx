import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, BrowserRouter, Routes, Route } from 'react-router-dom';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v6';
import { vi } from 'vitest';
import { ApiContext, type ApiClient } from '../lib/api';
import { ToastProvider } from '../components/ui/Toast';

/**
 * Creates a mock API client with all methods stubbed.
 * Override specific methods by passing an overrides object.
 */
export function createMockApi(overrides?: Partial<{
  tenants: Partial<ApiClient['tenants']>;
  dataRooms: Partial<ApiClient['dataRooms']>;
  folders: Partial<ApiClient['folders']>;
  files: Partial<ApiClient['files']>;
  pipelines: Partial<ApiClient['pipelines']>;
  pipelineRuns: Partial<ApiClient['pipelineRuns']>;
}>): ApiClient {
  return {
    baseUrl: 'http://localhost:3001',
    token: 'test-token',
    tenants: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      ...overrides?.tenants,
    },
    dataRooms: {
      list: vi.fn().mockResolvedValue([]),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getFolders: vi.fn().mockResolvedValue([]),
      getPipelineRuns: vi.fn(),
      ...overrides?.dataRooms,
    },
    folders: {
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getFiles: vi.fn(),
      ...overrides?.folders,
    },
    files: {
      get: vi.fn(),
      upload: vi.fn(),
      uploadVersion: vi.fn(),
      delete: vi.fn(),
      getVersions: vi.fn(),
      ...overrides?.files,
    },
    pipelines: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getRuns: vi.fn(),
      ...overrides?.pipelines,
    },
    pipelineRuns: {
      get: vi.fn(),
      getByFileVersion: vi.fn(),
      create: vi.fn(),
      retry: vi.fn(),
      ...overrides?.pipelineRuns,
    },
  };
}

export interface TestWrapperOptions {
  /** Initial URL entries for MemoryRouter (default: ['/']) */
  initialEntries?: string[];
  /** Include ToastProvider in wrapper (default: false) */
  withToast?: boolean;
  /** Route path pattern for components that use route params (e.g., '/data-rooms/:id') */
  routePath?: string;
  /** Use BrowserRouter instead of MemoryRouter (default: false) */
  useBrowserRouter?: boolean;
}

/**
 * Creates a test wrapper component with all necessary providers.
 * Use this to wrap components in tests that need API context, React Query, and routing.
 */
export function createTestWrapper(
  api: ApiClient,
  options: TestWrapperOptions = {}
) {
  const {
    initialEntries = ['/'],
    withToast = false,
    routePath,
    useBrowserRouter = false,
  } = options;

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => {
    let content = children;

    // Wrap with route if routePath is specified
    if (routePath) {
      content = (
        <Routes>
          <Route path={routePath} element={content} />
        </Routes>
      );
    }

    // Wrap with ToastProvider if needed
    if (withToast) {
      content = <ToastProvider>{content}</ToastProvider>;
    }

    // Wrap with providers
    content = (
      <ApiContext.Provider value={api}>
        <QueryClientProvider client={queryClient}>
          {content}
        </QueryClientProvider>
      </ApiContext.Provider>
    );

    // Wrap with NuqsAdapter
    content = <NuqsAdapter>{content}</NuqsAdapter>;

    // Wrap with Router
    if (useBrowserRouter) {
      return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          {content}
        </BrowserRouter>
      );
    }

    return (
      <MemoryRouter initialEntries={initialEntries} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {content}
      </MemoryRouter>
    );
  };
}
