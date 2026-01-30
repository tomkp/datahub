import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ApiContext, type ApiClient } from '../lib/api';
import { FileTree } from './FileTree';

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

describe('FileTree', () => {
  it('renders folders and files', async () => {
    const api = createMockApi();
    api.dataRooms.getFolders = vi.fn().mockResolvedValue([
      { id: 'f1', name: 'Documents', dataRoomId: 'r1', path: '/Documents' },
      { id: 'f2', name: 'Images', dataRoomId: 'r1', path: '/Images' },
    ]);

    render(<FileTree dataRoomId="r1" />, { wrapper: createWrapper(api) });

    expect(await screen.findByText('Documents')).toBeInTheDocument();
    expect(await screen.findByText('Images')).toBeInTheDocument();
  });

  it('calls onSelectFolder when folder is clicked', async () => {
    const api = createMockApi();
    api.dataRooms.getFolders = vi.fn().mockResolvedValue([
      { id: 'f1', name: 'Documents', dataRoomId: 'r1', path: '/Documents' },
    ]);

    const onSelectFolder = vi.fn();
    render(<FileTree dataRoomId="r1" onSelectFolder={onSelectFolder} />, {
      wrapper: createWrapper(api),
    });

    const folder = await screen.findByText('Documents');
    fireEvent.click(folder);

    expect(onSelectFolder).toHaveBeenCalledWith('f1');
  });

  it('renders loading state', () => {
    const api = createMockApi();
    api.dataRooms.getFolders = vi.fn().mockImplementation(() => new Promise(() => {}));

    render(<FileTree dataRoomId="r1" />, { wrapper: createWrapper(api) });

    expect(screen.getByTestId('folder-loading')).toBeInTheDocument();
  });

  it('renders empty state when no folders', async () => {
    const api = createMockApi();
    api.dataRooms.getFolders = vi.fn().mockResolvedValue([]);

    render(<FileTree dataRoomId="r1" />, { wrapper: createWrapper(api) });

    expect(await screen.findByText(/no folders/i)).toBeInTheDocument();
  });

  // Accessibility tests
  describe('accessibility', () => {
    it('has role="tree" on the container', async () => {
      const api = createMockApi();
      api.dataRooms.getFolders = vi.fn().mockResolvedValue([
        { id: 'f1', name: 'Documents', dataRoomId: 'r1', path: '/Documents' },
      ]);

      render(<FileTree dataRoomId="r1" />, { wrapper: createWrapper(api) });

      await screen.findByText('Documents');
      const tree = screen.getByRole('tree');
      expect(tree).toBeInTheDocument();
    });

    it('has role="treeitem" on folder buttons', async () => {
      const api = createMockApi();
      api.dataRooms.getFolders = vi.fn().mockResolvedValue([
        { id: 'f1', name: 'Documents', dataRoomId: 'r1', path: '/Documents' },
      ]);

      render(<FileTree dataRoomId="r1" />, { wrapper: createWrapper(api) });

      const treeitem = await screen.findByRole('treeitem', { name: /documents/i });
      expect(treeitem).toBeInTheDocument();
    });

    it('has aria-selected on selected folder', async () => {
      const api = createMockApi();
      api.dataRooms.getFolders = vi.fn().mockResolvedValue([
        { id: 'f1', name: 'Documents', dataRoomId: 'r1', path: '/Documents' },
      ]);

      render(<FileTree dataRoomId="r1" selectedFolderId="f1" />, {
        wrapper: createWrapper(api),
      });

      const treeitem = await screen.findByRole('treeitem', { name: /documents/i });
      expect(treeitem).toHaveAttribute('aria-selected', 'true');
    });

    it('has aria-expanded on folders with children', async () => {
      const api = createMockApi();
      api.dataRooms.getFolders = vi.fn().mockResolvedValue([
        { id: 'f1', name: 'Documents', dataRoomId: 'r1', path: '/Documents' },
        { id: 'f2', name: 'Subfolder', dataRoomId: 'r1', path: '/Documents/Subfolder', parentId: 'f1' },
      ]);

      render(<FileTree dataRoomId="r1" />, { wrapper: createWrapper(api) });

      const parentFolder = await screen.findByRole('treeitem', { name: /documents/i });
      expect(parentFolder).toHaveAttribute('aria-expanded', 'false');
    });

    it('updates aria-expanded when folder is expanded', async () => {
      const api = createMockApi();
      api.dataRooms.getFolders = vi.fn().mockResolvedValue([
        { id: 'f1', name: 'Documents', dataRoomId: 'r1', path: '/Documents' },
        { id: 'f2', name: 'Subfolder', dataRoomId: 'r1', path: '/Documents/Subfolder', parentId: 'f1' },
      ]);

      render(<FileTree dataRoomId="r1" />, { wrapper: createWrapper(api) });

      const parentFolder = await screen.findByRole('treeitem', { name: /documents/i });
      fireEvent.click(parentFolder);

      expect(parentFolder).toHaveAttribute('aria-expanded', 'true');
    });
  });
});
