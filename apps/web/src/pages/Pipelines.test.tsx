import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createMockApi, createTestWrapper } from '../test-utils/setup';
import { Pipelines } from './Pipelines';

describe('Pipelines', () => {
  it('renders the pipelines page', async () => {
    const api = createMockApi();
    render(<Pipelines />, { wrapper: createTestWrapper(api, { initialEntries: ['/pipelines'] }) });

    expect(await screen.findByRole('heading', { level: 1, name: /pipelines/i })).toBeInTheDocument();
  });

  it('has filter tabs', async () => {
    const api = createMockApi();
    render(<Pipelines />, { wrapper: createTestWrapper(api, { initialEntries: ['/pipelines'] }) });

    expect(await screen.findByRole('button', { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /active/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /failed/i })).toBeInTheDocument();
  });

  describe('filter state management', () => {
    it('defaults filter to "all"', async () => {
      const api = createMockApi();
      render(<Pipelines />, { wrapper: createTestWrapper(api, { initialEntries: ['/pipelines'] }) });

      const allButton = await screen.findByRole('button', { name: /all/i });
      // Active tab has different styling - check for shadow-sm class which indicates selected state
      expect(allButton).toHaveClass('shadow-sm');
    });

    it('can change filter to active', async () => {
      const api = createMockApi();
      render(<Pipelines />, { wrapper: createTestWrapper(api, { initialEntries: ['/pipelines'] }) });

      const activeButton = await screen.findByRole('button', { name: /active/i });
      fireEvent.click(activeButton);

      expect(activeButton).toHaveClass('shadow-sm');
    });

    it('can change filter to failed', async () => {
      const api = createMockApi();
      render(<Pipelines />, { wrapper: createTestWrapper(api, { initialEntries: ['/pipelines'] }) });

      const failedButton = await screen.findByRole('button', { name: /failed/i });
      fireEvent.click(failedButton);

      expect(failedButton).toHaveClass('shadow-sm');
    });
  });
});
