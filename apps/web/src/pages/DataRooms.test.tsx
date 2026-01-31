import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createMockApi, createTestWrapper } from '../test-utils/setup';
import { DataRooms } from './DataRooms';

describe('DataRooms', () => {
  it('renders the data rooms page', async () => {
    const api = createMockApi();
    render(<DataRooms />, { wrapper: createTestWrapper(api, { initialEntries: ['/data-rooms'] }) });

    expect(await screen.findByRole('heading', { level: 1, name: /data rooms/i })).toBeInTheDocument();
  });

  it('has a new data room button', async () => {
    const api = createMockApi();
    render(<DataRooms />, { wrapper: createTestWrapper(api, { initialEntries: ['/data-rooms'] }) });

    expect(await screen.findByRole('button', { name: /new data room/i })).toBeInTheDocument();
  });

  describe('create modal state', () => {
    it('does not show create form initially', async () => {
      const api = createMockApi();
      render(<DataRooms />, { wrapper: createTestWrapper(api, { initialEntries: ['/data-rooms'] }) });

      await screen.findByRole('heading', { level: 1, name: /data rooms/i });
      expect(screen.queryByPlaceholderText(/enter data room name/i)).not.toBeInTheDocument();
    });

    it('shows create form when new data room button is clicked', async () => {
      const api = createMockApi();
      render(<DataRooms />, { wrapper: createTestWrapper(api, { initialEntries: ['/data-rooms'] }) });

      const button = await screen.findByRole('button', { name: /new data room/i });
      fireEvent.click(button);

      expect(await screen.findByPlaceholderText(/enter data room name/i)).toBeInTheDocument();
    });

    it('hides create form when cancel is clicked', async () => {
      const api = createMockApi();
      render(<DataRooms />, { wrapper: createTestWrapper(api, { initialEntries: ['/data-rooms'] }) });

      const newButton = await screen.findByRole('button', { name: /new data room/i });
      fireEvent.click(newButton);

      const cancelButton = await screen.findByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(screen.queryByPlaceholderText(/enter data room name/i)).not.toBeInTheDocument();
    });

    it('has a create button that is disabled when name is empty', async () => {
      const api = createMockApi();
      render(<DataRooms />, { wrapper: createTestWrapper(api, { initialEntries: ['/data-rooms'] }) });

      const newButton = await screen.findByRole('button', { name: /new data room/i });
      fireEvent.click(newButton);

      const createButton = await screen.findByRole('button', { name: /^create$/i });
      expect(createButton).toBeDisabled();
    });

    it('enables create button when name is entered', async () => {
      const api = createMockApi();
      render(<DataRooms />, { wrapper: createTestWrapper(api, { initialEntries: ['/data-rooms'] }) });

      const newButton = await screen.findByRole('button', { name: /new data room/i });
      fireEvent.click(newButton);

      const input = await screen.findByPlaceholderText(/enter data room name/i);
      fireEvent.change(input, { target: { value: 'Test Room' } });

      const createButton = await screen.findByRole('button', { name: /^create$/i });
      expect(createButton).toBeEnabled();
    });
  });
});
