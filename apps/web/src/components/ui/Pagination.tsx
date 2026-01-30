import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage?: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handlePrevious = () => {
    if (canGoPrevious) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onPageChange(currentPage + 1);
    }
  };

  const showItemRange = itemsPerPage !== undefined && totalItems !== undefined;
  const startItem = showItemRange ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = showItemRange
    ? Math.min(currentPage * itemsPerPage, totalItems)
    : 0;

  return (
    <div className="flex items-center justify-between py-3">
      <div className="text-sm text-muted-foreground">
        {showItemRange && (
          <span>
            {startItem}-{endItem} of {totalItems}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevious}
          disabled={!canGoPrevious}
          aria-label="Previous page"
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors duration-150"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
        <span className="text-sm text-muted-foreground px-2">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={handleNext}
          disabled={!canGoNext}
          aria-label="Next page"
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors duration-150"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
