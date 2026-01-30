import { X } from 'lucide-react';

export interface FileFilterState {
  fileTypes?: string[];
  dateRange?: 'today' | 'last7days' | 'last30days' | 'all';
}

interface FileFiltersProps {
  filters: FileFilterState;
  onFiltersChange: (filters: FileFilterState) => void;
}

const FILE_TYPE_OPTIONS = [
  { value: 'csv', label: 'CSV' },
  { value: 'xlsx', label: 'Excel' },
  { value: 'txt', label: 'Text' },
  { value: 'tsv', label: 'TSV' },
];

const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'last7days', label: 'Last 7 days' },
  { value: 'last30days', label: 'Last 30 days' },
];

export function FileFilters({ filters, onFiltersChange }: FileFiltersProps) {
  const hasActiveFilters =
    (filters.fileTypes && filters.fileTypes.length > 0) ||
    (filters.dateRange && filters.dateRange !== 'all');

  const handleFileTypeChange = (fileType: string, checked: boolean) => {
    const currentTypes = filters.fileTypes || [];
    const newTypes = checked
      ? [...currentTypes, fileType]
      : currentTypes.filter((t) => t !== fileType);

    onFiltersChange({
      ...filters,
      fileTypes: newTypes.length > 0 ? newTypes : undefined,
    });
  };

  const handleDateRangeChange = (dateRange: string) => {
    onFiltersChange({
      ...filters,
      dateRange: dateRange === 'all' ? undefined : (dateRange as FileFilterState['dateRange']),
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="flex items-center gap-6 py-3 border-b border-border">
      {/* File Type Filter */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          File Type
        </span>
        <div className="flex items-center gap-2">
          {FILE_TYPE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-1.5 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={filters.fileTypes?.includes(option.value) || false}
                onChange={(e) =>
                  handleFileTypeChange(option.value, e.target.checked)
                }
                className="rounded border-border text-primary focus:ring-primary/20"
              />
              <span className="text-foreground">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Date Range
        </span>
        <select
          value={filters.dateRange || 'all'}
          onChange={(e) => handleDateRangeChange(e.target.value)}
          className="px-2 py-1 text-sm rounded border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {DATE_RANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={handleClearFilters}
          className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3 w-3" />
          Clear filters
        </button>
      )}
    </div>
  );
}

// Helper function to apply filters to file list
export function applyFileFilters<T extends { name: string; updatedAt?: string }>(
  files: T[],
  filters: FileFilterState
): T[] {
  let filtered = [...files];

  // Filter by file type
  if (filters.fileTypes && filters.fileTypes.length > 0) {
    filtered = filtered.filter((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return filters.fileTypes!.some((type) => {
        if (type === 'xlsx') {
          return ['xls', 'xlsx', 'xlsm', 'xlsb'].includes(ext || '');
        }
        return ext === type;
      });
    });
  }

  // Filter by date range
  if (filters.dateRange && filters.dateRange !== 'all') {
    const now = new Date();
    let cutoffDate: Date;

    switch (filters.dateRange) {
      case 'today':
        cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'last7days':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last30days':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffDate = new Date(0);
    }

    filtered = filtered.filter((file) => {
      if (!file.updatedAt) return false;
      return new Date(file.updatedAt) >= cutoffDate;
    });
  }

  return filtered;
}
