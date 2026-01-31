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

  // Keyboard navigation tests
  describe('keyboard navigation', () => {
    it('handles ArrowDown key press', async () => {
      const api = createMockApi();
      api.dataRooms.getFolders = vi.fn().mockResolvedValue([
        { id: 'f1', name: 'Documents', dataRoomId: 'r1', path: '/Documents' },
        { id: 'f2', name: 'Images', dataRoomId: 'r1', path: '/Images' },
      ]);

      render(<FileTree dataRoomId="r1" />, { wrapper: createWrapper(api) });

      const firstFolder = await screen.findByRole('treeitem', { name: /documents/i });

      // Verify ArrowDown doesn't throw and component handles it
      firstFolder.focus();
      expect(() => {
        fireEvent.keyDown(firstFolder, { key: 'ArrowDown' });
      }).not.toThrow();
    });

    it('handles ArrowUp key press', async () => {
      const api = createMockApi();
      api.dataRooms.getFolders = vi.fn().mockResolvedValue([
        { id: 'f1', name: 'Documents', dataRoomId: 'r1', path: '/Documents' },
        { id: 'f2', name: 'Images', dataRoomId: 'r1', path: '/Images' },
      ]);

      render(<FileTree dataRoomId="r1" />, { wrapper: createWrapper(api) });

      const secondFolder = await screen.findByRole('treeitem', { name: /images/i });

      // Verify ArrowUp doesn't throw and component handles it
      secondFolder.focus();
      expect(() => {
        fireEvent.keyDown(secondFolder, { key: 'ArrowUp' });
      }).not.toThrow();
    });

    it('expands folder with ArrowRight', async () => {
      const api = createMockApi();
      api.dataRooms.getFolders = vi.fn().mockResolvedValue([
        { id: 'f1', name: 'Documents', dataRoomId: 'r1', path: '/Documents' },
        { id: 'f2', name: 'Subfolder', dataRoomId: 'r1', path: '/Documents/Subfolder', parentId: 'f1' },
      ]);

      render(<FileTree dataRoomId="r1" />, { wrapper: createWrapper(api) });

      const parentFolder = await screen.findByRole('treeitem', { name: /documents/i });
      expect(parentFolder).toHaveAttribute('aria-expanded', 'false');

      parentFolder.focus();
      fireEvent.keyDown(parentFolder, { key: 'ArrowRight' });

      expect(parentFolder).toHaveAttribute('aria-expanded', 'true');
    });

    it('collapses folder with ArrowLeft', async () => {
      const api = createMockApi();
      api.dataRooms.getFolders = vi.fn().mockResolvedValue([
        { id: 'f1', name: 'Documents', dataRoomId: 'r1', path: '/Documents' },
        { id: 'f2', name: 'Subfolder', dataRoomId: 'r1', path: '/Documents/Subfolder', parentId: 'f1' },
      ]);

      render(<FileTree dataRoomId="r1" />, { wrapper: createWrapper(api) });

      const parentFolder = await screen.findByRole('treeitem', { name: /documents/i });

      // First expand
      fireEvent.click(parentFolder);
      expect(parentFolder).toHaveAttribute('aria-expanded', 'true');

      // Then collapse with keyboard
      parentFolder.focus();
      fireEvent.keyDown(parentFolder, { key: 'ArrowLeft' });

      expect(parentFolder).toHaveAttribute('aria-expanded', 'false');
    });

    it('selects folder with Enter key', async () => {
      const api = createMockApi();
      api.dataRooms.getFolders = vi.fn().mockResolvedValue([
        { id: 'f1', name: 'Documents', dataRoomId: 'r1', path: '/Documents' },
      ]);

      const onSelectFolder = vi.fn();
      render(<FileTree dataRoomId="r1" onSelectFolder={onSelectFolder} />, {
        wrapper: createWrapper(api),
      });

      const folder = await screen.findByRole('treeitem', { name: /documents/i });

      folder.focus();
      fireEvent.keyDown(folder, { key: 'Enter' });

      expect(onSelectFolder).toHaveBeenCalledWith('f1');
    });
  });

  // Auto-expanding ancestor folders tests
  describe('auto-expanding ancestors', () => {
    it('auto-expands ancestor folders when selectedFolderId is provided on initial render', async () => {
      const api = createMockApi();
      api.dataRooms.getFolders = vi.fn().mockResolvedValue([
        { id: 'root', name: 'Root', dataRoomId: 'r1', path: '/Root' },
        { id: 'parent', name: 'Parent', dataRoomId: 'r1', path: '/Root/Parent', parentId: 'root' },
        { id: 'child', name: 'Child', dataRoomId: 'r1', path: '/Root/Parent/Child', parentId: 'parent' },
      ]);

      render(<FileTree dataRoomId="r1" selectedFolderId="child" />, {
        wrapper: createWrapper(api),
      });

      // Wait for component to render and expand ancestors
      const rootFolder = await screen.findByRole('treeitem', { name: /^root$/i });
      const parentFolder = await screen.findByRole('treeitem', { name: /^parent$/i });
      const childFolder = await screen.findByRole('treeitem', { name: /^child$/i });

      // Both root and parent should be expanded to show the selected child
      expect(rootFolder).toHaveAttribute('aria-expanded', 'true');
      expect(parentFolder).toHaveAttribute('aria-expanded', 'true');

      // Child folder should be visible and selected
      expect(childFolder).toBeVisible();
      expect(childFolder).toHaveAttribute('aria-selected', 'true');
    });

    it('expands multiple levels of ancestors', async () => {
      const api = createMockApi();
      api.dataRooms.getFolders = vi.fn().mockResolvedValue([
        { id: 'level1', name: 'Level 1', dataRoomId: 'r1', path: '/Level1' },
        { id: 'level2', name: 'Level 2', dataRoomId: 'r1', path: '/Level1/Level2', parentId: 'level1' },
        { id: 'level3', name: 'Level 3', dataRoomId: 'r1', path: '/Level1/Level2/Level3', parentId: 'level2' },
        { id: 'level4', name: 'Level 4', dataRoomId: 'r1', path: '/Level1/Level2/Level3/Level4', parentId: 'level3' },
      ]);

      render(<FileTree dataRoomId="r1" selectedFolderId="level4" />, {
        wrapper: createWrapper(api),
      });

      // All ancestor folders should be expanded
      const level1 = await screen.findByRole('treeitem', { name: /^level 1$/i });
      const level2 = await screen.findByRole('treeitem', { name: /^level 2$/i });
      const level3 = await screen.findByRole('treeitem', { name: /^level 3$/i });
      const level4 = await screen.findByRole('treeitem', { name: /^level 4$/i });

      expect(level1).toHaveAttribute('aria-expanded', 'true');
      expect(level2).toHaveAttribute('aria-expanded', 'true');
      expect(level3).toHaveAttribute('aria-expanded', 'true');
      expect(level4).toHaveAttribute('aria-selected', 'true');
    });

    it('does not expand folders when selectedFolderId is a root folder', async () => {
      const api = createMockApi();
      api.dataRooms.getFolders = vi.fn().mockResolvedValue([
        { id: 'root1', name: 'Root 1', dataRoomId: 'r1', path: '/Root1' },
        { id: 'root2', name: 'Root 2', dataRoomId: 'r1', path: '/Root2' },
        { id: 'child', name: 'Child', dataRoomId: 'r1', path: '/Root2/Child', parentId: 'root2' },
      ]);

      render(<FileTree dataRoomId="r1" selectedFolderId="root1" />, {
        wrapper: createWrapper(api),
      });

      const root1 = await screen.findByRole('treeitem', { name: /^root 1$/i });
      const root2 = await screen.findByRole('treeitem', { name: /^root 2$/i });

      // Root folders should not be expanded (no ancestors to expand)
      expect(root1).toHaveAttribute('aria-selected', 'true');
      expect(root1).not.toHaveAttribute('aria-expanded');
      expect(root2).toHaveAttribute('aria-expanded', 'false');
    });

    it('only expands ancestors of the selected folder, not siblings', async () => {
      const api = createMockApi();
      api.dataRooms.getFolders = vi.fn().mockResolvedValue([
        { id: 'parent', name: 'Parent', dataRoomId: 'r1', path: '/Parent' },
        { id: 'child1', name: 'Child 1', dataRoomId: 'r1', path: '/Parent/Child1', parentId: 'parent' },
        { id: 'child2', name: 'Child 2', dataRoomId: 'r1', path: '/Parent/Child2', parentId: 'parent' },
        { id: 'grandchild', name: 'Grandchild', dataRoomId: 'r1', path: '/Parent/Child1/Grandchild', parentId: 'child1' },
        { id: 'grandchild2', name: 'Grandchild 2', dataRoomId: 'r1', path: '/Parent/Child2/Grandchild2', parentId: 'child2' },
      ]);

      render(<FileTree dataRoomId="r1" selectedFolderId="grandchild" />, {
        wrapper: createWrapper(api),
      });

      const parent = await screen.findByRole('treeitem', { name: /^parent$/i });
      const child1 = await screen.findByRole('treeitem', { name: /^child 1$/i });
      const child2 = await screen.findByRole('treeitem', { name: /^child 2$/i });

      // Parent and child1 should be expanded (ancestors of grandchild)
      expect(parent).toHaveAttribute('aria-expanded', 'true');
      expect(child1).toHaveAttribute('aria-expanded', 'true');

      // child2 is a sibling with children but should not be auto-expanded
      expect(child2).toHaveAttribute('aria-expanded', 'false');
    });
  });
});
