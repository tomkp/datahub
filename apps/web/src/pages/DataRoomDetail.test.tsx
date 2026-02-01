import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createMockApi, createTestWrapper } from '../test-utils/setup';
import { DataRoomDetail } from './DataRoomDetail';

describe('DataRoomDetail', () => {
  it('renders the data room name', async () => {
    const api = createMockApi({
      dataRooms: {
        get: vi.fn().mockResolvedValue({ id: 'dr1', name: 'Test Data Room' }),
      },
      pipelines: {
        list: vi.fn().mockResolvedValue([]),
      },
    });
    render(<DataRoomDetail />, {
      wrapper: createTestWrapper(api, {
        initialEntries: ['/data-rooms/dr1'],
        routePath: '/data-rooms/:id',
        withToast: true,
      })
    });

    expect(await screen.findByRole('heading', { level: 1, name: /test data room/i })).toBeInTheDocument();
  });

  it('has a new folder button', async () => {
    const api = createMockApi({
      dataRooms: {
        get: vi.fn().mockResolvedValue({ id: 'dr1', name: 'Test Data Room' }),
      },
      pipelines: {
        list: vi.fn().mockResolvedValue([]),
      },
    });
    render(<DataRoomDetail />, {
      wrapper: createTestWrapper(api, {
        initialEntries: ['/data-rooms/dr1'],
        routePath: '/data-rooms/:id',
        withToast: true,
      })
    });

    expect(await screen.findByRole('button', { name: /new folder/i })).toBeInTheDocument();
  });

  describe('create folder modal state', () => {
    it('does not show create folder form initially', async () => {
      const api = createMockApi({
        dataRooms: {
          get: vi.fn().mockResolvedValue({ id: 'dr1', name: 'Test Data Room' }),
        },
      });
      render(<DataRoomDetail />, {
        wrapper: createTestWrapper(api, {
          initialEntries: ['/data-rooms/dr1'],
          routePath: '/data-rooms/:id',
          withToast: true,
        })
      });

      await screen.findByRole('heading', { level: 1, name: /test data room/i });
      expect(screen.queryByPlaceholderText(/enter folder name/i)).not.toBeInTheDocument();
    });

    it('shows create folder form when new folder button is clicked', async () => {
      const api = createMockApi({
        dataRooms: {
          get: vi.fn().mockResolvedValue({ id: 'dr1', name: 'Test Data Room' }),
        },
      });
      render(<DataRoomDetail />, {
        wrapper: createTestWrapper(api, {
          initialEntries: ['/data-rooms/dr1'],
          routePath: '/data-rooms/:id',
          withToast: true,
        })
      });

      const button = await screen.findByRole('button', { name: /new folder/i });
      fireEvent.click(button);

      expect(await screen.findByPlaceholderText(/enter folder name/i)).toBeInTheDocument();
    });

    it('hides create folder form when cancel is clicked', async () => {
      const api = createMockApi({
        dataRooms: {
          get: vi.fn().mockResolvedValue({ id: 'dr1', name: 'Test Data Room' }),
        },
      });
      render(<DataRoomDetail />, {
        wrapper: createTestWrapper(api, {
          initialEntries: ['/data-rooms/dr1'],
          routePath: '/data-rooms/:id',
          withToast: true,
        })
      });

      const newButton = await screen.findByRole('button', { name: /new folder/i });
      fireEvent.click(newButton);

      const cancelButton = await screen.findByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(screen.queryByPlaceholderText(/enter folder name/i)).not.toBeInTheDocument();
    });

    it('has a create button that is disabled when name is empty', async () => {
      const api = createMockApi({
        dataRooms: {
          get: vi.fn().mockResolvedValue({ id: 'dr1', name: 'Test Data Room' }),
        },
      });
      render(<DataRoomDetail />, {
        wrapper: createTestWrapper(api, {
          initialEntries: ['/data-rooms/dr1'],
          routePath: '/data-rooms/:id',
          withToast: true,
        })
      });

      const newButton = await screen.findByRole('button', { name: /new folder/i });
      fireEvent.click(newButton);

      const createButton = await screen.findByRole('button', { name: /^create$/i });
      expect(createButton).toBeDisabled();
    });

    it('enables create button when name is entered', async () => {
      const api = createMockApi({
        dataRooms: {
          get: vi.fn().mockResolvedValue({ id: 'dr1', name: 'Test Data Room' }),
        },
      });
      render(<DataRoomDetail />, {
        wrapper: createTestWrapper(api, {
          initialEntries: ['/data-rooms/dr1'],
          routePath: '/data-rooms/:id',
          withToast: true,
        })
      });

      const newButton = await screen.findByRole('button', { name: /new folder/i });
      fireEvent.click(newButton);

      const input = await screen.findByPlaceholderText(/enter folder name/i);
      fireEvent.change(input, { target: { value: 'Test Folder' } });

      const createButton = await screen.findByRole('button', { name: /^create$/i });
      expect(createButton).toBeEnabled();
    });
  });

  describe('Responsive Layout', () => {
    it('shows file tree toggle button on mobile', async () => {
      const api = createMockApi({
        dataRooms: {
          get: vi.fn().mockResolvedValue({ id: 'dr1', name: 'Test Data Room' }),
        },
      });
      render(<DataRoomDetail />, {
        wrapper: createTestWrapper(api, {
          initialEntries: ['/data-rooms/dr1'],
          routePath: '/data-rooms/:id',
          withToast: true,
        })
      });

      await screen.findByRole('heading', { level: 1, name: /test data room/i });
      const toggleButton = screen.getByRole('button', { name: /toggle file tree/i });
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toHaveClass('lg:hidden');
    });

    it('file tree is hidden by default on mobile', async () => {
      const api = createMockApi({
        dataRooms: {
          get: vi.fn().mockResolvedValue({ id: 'dr1', name: 'Test Data Room' }),
        },
      });
      render(<DataRoomDetail />, {
        wrapper: createTestWrapper(api, {
          initialEntries: ['/data-rooms/dr1'],
          routePath: '/data-rooms/:id',
          withToast: true,
        })
      });

      await screen.findByRole('heading', { level: 1, name: /test data room/i });
      const fileTree = screen.getByTestId('file-tree-container');
      expect(fileTree).toHaveClass('hidden');
      expect(fileTree).toHaveClass('lg:block');
    });

    it('toggles file tree visibility when toggle button is clicked', async () => {
      const api = createMockApi({
        dataRooms: {
          get: vi.fn().mockResolvedValue({ id: 'dr1', name: 'Test Data Room' }),
        },
      });
      render(<DataRoomDetail />, {
        wrapper: createTestWrapper(api, {
          initialEntries: ['/data-rooms/dr1'],
          routePath: '/data-rooms/:id',
          withToast: true,
        })
      });

      await screen.findByRole('heading', { level: 1, name: /test data room/i });
      const toggleButton = screen.getByRole('button', { name: /toggle file tree/i });
      const fileTree = screen.getByTestId('file-tree-container');

      // Initially translated off-screen
      expect(fileTree).toHaveClass('-translate-x-full');

      // Click to open
      fireEvent.click(toggleButton);
      expect(fileTree).toHaveClass('translate-x-0');
      expect(fileTree).not.toHaveClass('-translate-x-full');

      // Click to close
      fireEvent.click(toggleButton);
      expect(fileTree).toHaveClass('-translate-x-full');
      expect(fileTree).not.toHaveClass('translate-x-0');
    });

    it('shows backdrop when file tree is open on mobile', async () => {
      const api = createMockApi({
        dataRooms: {
          get: vi.fn().mockResolvedValue({ id: 'dr1', name: 'Test Data Room' }),
        },
      });
      render(<DataRoomDetail />, {
        wrapper: createTestWrapper(api, {
          initialEntries: ['/data-rooms/dr1'],
          routePath: '/data-rooms/:id',
          withToast: true,
        })
      });

      await screen.findByRole('heading', { level: 1, name: /test data room/i });
      const toggleButton = screen.getByRole('button', { name: /toggle file tree/i });

      // Open file tree
      fireEvent.click(toggleButton);

      // Backdrop should be visible
      const backdrop = screen.getByTestId('file-tree-backdrop');
      expect(backdrop).toBeInTheDocument();
    });

    it('closes file tree when backdrop is clicked', async () => {
      const api = createMockApi({
        dataRooms: {
          get: vi.fn().mockResolvedValue({ id: 'dr1', name: 'Test Data Room' }),
        },
      });
      render(<DataRoomDetail />, {
        wrapper: createTestWrapper(api, {
          initialEntries: ['/data-rooms/dr1'],
          routePath: '/data-rooms/:id',
          withToast: true,
        })
      });

      await screen.findByRole('heading', { level: 1, name: /test data room/i });
      const toggleButton = screen.getByRole('button', { name: /toggle file tree/i });

      // Open file tree
      fireEvent.click(toggleButton);
      const backdrop = screen.getByTestId('file-tree-backdrop');

      // Click backdrop
      fireEvent.click(backdrop);

      // File tree should close
      const fileTree = screen.getByTestId('file-tree-container');
      expect(fileTree).toHaveClass('hidden');
    });

    it.skip('file details panel has drawer classes on mobile', async () => {
      const api = createMockApi({
        dataRooms: {
          get: vi.fn().mockResolvedValue({ id: 'dr1', name: 'Test Data Room' }),
          getFolders: vi.fn().mockResolvedValue([
            { id: 'f1', name: 'Folder 1', parentId: null },
          ]),
        },
        folders: {
          getFiles: vi.fn().mockResolvedValue([
            { id: 'file1', name: 'test.pdf', folderId: 'f1' },
          ]),
        },
        pipelines: {
          list: vi.fn().mockResolvedValue([]),
        },
        files: {
          get: vi.fn().mockResolvedValue({
            id: 'file1',
            name: 'test.pdf',
            folderId: 'f1',
            size: 1024,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          }),
          getVersions: vi.fn().mockResolvedValue([
            {
              id: 'v1',
              fileId: 'file1',
              version: 1,
              size: 1024,
              createdAt: '2024-01-01',
            },
          ]),
        },
        pipelineRuns: {
          getByFileVersion: vi.fn().mockResolvedValue(null),
        },
      });
      render(<DataRoomDetail />, {
        wrapper: createTestWrapper(api, {
          initialEntries: ['/data-rooms/dr1?folder=f1&file=file1'],
          routePath: '/data-rooms/:id',
          withToast: true,
        })
      });

      await screen.findByRole('heading', { level: 1, name: /test data room/i });

      // Wait for the file details panel to appear
      const detailsPanel = await screen.findByTestId('file-details-panel');

      // Should be positioned as fixed on mobile
      expect(detailsPanel).toHaveClass('fixed');
      expect(detailsPanel).toHaveClass('lg:static');
    });
  });
});
