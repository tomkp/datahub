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

  it('has a filter dropdown', async () => {
    const api = createMockApi();
    render(<Pipelines />, { wrapper: createTestWrapper(api, { initialEntries: ['/pipelines'] }) });

    expect(await screen.findByRole('combobox')).toBeInTheDocument();
  });

  describe('filter state management', () => {
    it('defaults filter to "all"', async () => {
      const api = createMockApi();
      render(<Pipelines />, { wrapper: createTestWrapper(api, { initialEntries: ['/pipelines'] }) });

      const select = await screen.findByRole('combobox');
      expect(select).toHaveValue('all');
    });

    it('can change filter to active', async () => {
      const api = createMockApi();
      render(<Pipelines />, { wrapper: createTestWrapper(api, { initialEntries: ['/pipelines'] }) });

      const select = await screen.findByRole('combobox');
      fireEvent.change(select, { target: { value: 'active' } });

      expect(select).toHaveValue('active');
    });

    it('can change filter to failed', async () => {
      const api = createMockApi();
      render(<Pipelines />, { wrapper: createTestWrapper(api, { initialEntries: ['/pipelines'] }) });

      const select = await screen.findByRole('combobox');
      fireEvent.change(select, { target: { value: 'failed' } });

      expect(select).toHaveValue('failed');
    });

    it('has all three filter options available', async () => {
      const api = createMockApi();
      render(<Pipelines />, { wrapper: createTestWrapper(api, { initialEntries: ['/pipelines'] }) });

      const select = await screen.findByRole('combobox');
      const options = select.querySelectorAll('option');

      expect(options).toHaveLength(3);
      expect(options[0]).toHaveValue('all');
      expect(options[1]).toHaveValue('active');
      expect(options[2]).toHaveValue('failed');
    });
  });
});
