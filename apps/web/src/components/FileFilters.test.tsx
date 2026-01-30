import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { FileFilters, type FileFilterState } from './FileFilters';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('FileFilters', () => {
  it('renders filter options', () => {
    render(<FileFilters filters={{}} onFiltersChange={vi.fn()} />, { wrapper });
    expect(screen.getByText(/file type/i)).toBeInTheDocument();
    expect(screen.getByText(/date range/i)).toBeInTheDocument();
  });

  it('calls onFiltersChange when file type is selected', () => {
    const onFiltersChange = vi.fn();
    render(<FileFilters filters={{}} onFiltersChange={onFiltersChange} />, {
      wrapper,
    });

    const csvCheckbox = screen.getByLabelText(/csv/i);
    fireEvent.click(csvCheckbox);

    expect(onFiltersChange).toHaveBeenCalled();
  });

  it('calls onFiltersChange when date range is selected', () => {
    const onFiltersChange = vi.fn();
    render(<FileFilters filters={{}} onFiltersChange={onFiltersChange} />, {
      wrapper,
    });

    const dateSelect = screen.getByRole('combobox');
    fireEvent.change(dateSelect, { target: { value: 'last7days' } });

    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ dateRange: 'last7days' })
    );
  });

  it('shows clear button when filters are active', () => {
    const filters: FileFilterState = { fileTypes: ['csv'], dateRange: 'last7days' };
    render(<FileFilters filters={filters} onFiltersChange={vi.fn()} />, {
      wrapper,
    });

    expect(screen.getByText(/clear filters/i)).toBeInTheDocument();
  });

  it('hides clear button when no filters are active', () => {
    render(<FileFilters filters={{}} onFiltersChange={vi.fn()} />, { wrapper });
    expect(screen.queryByText(/clear filters/i)).not.toBeInTheDocument();
  });

  it('clears all filters when clear button is clicked', () => {
    const onFiltersChange = vi.fn();
    const filters: FileFilterState = { fileTypes: ['csv'], dateRange: 'last7days' };
    render(<FileFilters filters={filters} onFiltersChange={onFiltersChange} />, {
      wrapper,
    });

    fireEvent.click(screen.getByText(/clear filters/i));

    expect(onFiltersChange).toHaveBeenCalledWith({});
  });
});
