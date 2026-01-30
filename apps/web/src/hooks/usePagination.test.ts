import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from './usePagination';

describe('usePagination', () => {
  it('returns first page of items by default', () => {
    const items = Array.from({ length: 50 }, (_, i) => ({ id: i }));
    const { result } = renderHook(() => usePagination(items, 20));

    expect(result.current.currentPage).toBe(1);
    expect(result.current.paginatedItems).toHaveLength(20);
    expect(result.current.paginatedItems[0]).toEqual({ id: 0 });
    expect(result.current.paginatedItems[19]).toEqual({ id: 19 });
  });

  it('calculates totalPages correctly', () => {
    const items = Array.from({ length: 50 }, (_, i) => ({ id: i }));
    const { result } = renderHook(() => usePagination(items, 20));

    expect(result.current.totalPages).toBe(3);
    expect(result.current.totalItems).toBe(50);
  });

  it('handles goToPage navigation', () => {
    const items = Array.from({ length: 50 }, (_, i) => ({ id: i }));
    const { result } = renderHook(() => usePagination(items, 20));

    act(() => {
      result.current.goToPage(2);
    });

    expect(result.current.currentPage).toBe(2);
    expect(result.current.paginatedItems[0]).toEqual({ id: 20 });
    expect(result.current.paginatedItems[19]).toEqual({ id: 39 });
  });

  it('handles last page with fewer items', () => {
    const items = Array.from({ length: 50 }, (_, i) => ({ id: i }));
    const { result } = renderHook(() => usePagination(items, 20));

    act(() => {
      result.current.goToPage(3);
    });

    expect(result.current.currentPage).toBe(3);
    expect(result.current.paginatedItems).toHaveLength(10);
    expect(result.current.paginatedItems[0]).toEqual({ id: 40 });
    expect(result.current.paginatedItems[9]).toEqual({ id: 49 });
  });

  it('does not go below page 1', () => {
    const items = Array.from({ length: 50 }, (_, i) => ({ id: i }));
    const { result } = renderHook(() => usePagination(items, 20));

    act(() => {
      result.current.goToPage(0);
    });

    expect(result.current.currentPage).toBe(1);
  });

  it('does not go above totalPages', () => {
    const items = Array.from({ length: 50 }, (_, i) => ({ id: i }));
    const { result } = renderHook(() => usePagination(items, 20));

    act(() => {
      result.current.goToPage(10);
    });

    expect(result.current.currentPage).toBe(3);
  });

  it('clamps current page when items shrink', () => {
    const items1 = Array.from({ length: 50 }, (_, i) => ({ id: i }));
    const { result, rerender } = renderHook(
      ({ items }) => usePagination(items, 20),
      { initialProps: { items: items1 } }
    );

    act(() => {
      result.current.goToPage(3);
    });
    expect(result.current.currentPage).toBe(3);

    // When items shrink to only 2 pages, current page clamps to 2
    const items2 = Array.from({ length: 30 }, (_, i) => ({ id: i + 100 }));
    rerender({ items: items2 });

    expect(result.current.currentPage).toBe(2);
    expect(result.current.totalPages).toBe(2);
  });

  it('provides resetPage function to manually reset', () => {
    const items = Array.from({ length: 50 }, (_, i) => ({ id: i }));
    const { result } = renderHook(() => usePagination(items, 20));

    act(() => {
      result.current.goToPage(3);
    });
    expect(result.current.currentPage).toBe(3);

    act(() => {
      result.current.resetPage();
    });
    expect(result.current.currentPage).toBe(1);
  });

  it('handles empty items', () => {
    const { result } = renderHook(() => usePagination([], 20));

    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(0);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.paginatedItems).toHaveLength(0);
  });

  it('handles undefined items', () => {
    const { result } = renderHook(() => usePagination(undefined, 20));

    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(0);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.paginatedItems).toHaveLength(0);
  });
});
