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
});
