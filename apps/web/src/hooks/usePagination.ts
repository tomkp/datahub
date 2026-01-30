import { useState, useMemo, useCallback } from 'react';

interface UsePaginationResult<T> {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  paginatedItems: T[];
  goToPage: (page: number) => void;
  resetPage: () => void;
}

export function usePagination<T>(
  items: T[] | undefined,
  itemsPerPage: number
): UsePaginationResult<T> {
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = items?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Clamp current page to valid range
  const effectivePage = Math.max(1, Math.min(currentPage, totalPages || 1));

  const paginatedItems = useMemo(() => {
    if (!items || items.length === 0) {
      return [];
    }

    const startIndex = (effectivePage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return items.slice(startIndex, endIndex);
  }, [items, effectivePage, itemsPerPage]);

  const goToPage = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(validPage);
    },
    [totalPages]
  );

  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage: effectivePage,
    totalPages: totalItems > 0 ? totalPages : 0,
    totalItems,
    paginatedItems,
    goToPage,
    resetPage,
  };
}
