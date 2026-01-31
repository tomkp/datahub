import { File as FileIcon, FileText, FileImage, FileCode, MoreHorizontal, FilterX, Check, Loader2, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { useQueryState, parseAsStringLiteral } from 'nuqs';
import { useFiles } from '../hooks/useFiles';
import { type File as FileType } from '../lib/api';
import { cn } from '../lib/utils';
import { applyFileFilters, type FileFilterState } from './FileFilters';
import { FileTypeBadge } from './FileTypeBadge';
import { QueryError } from './ui';

const sortColumns = ['name', 'type', 'status', 'modified'] as const;
type SortColumn = typeof sortColumns[number];
const sortDirections = ['asc', 'desc'] as const;
type SortDirection = typeof sortDirections[number];

function PipelineStatusIcon({ status }: { status?: 'processing' | 'processed' | 'errored' }) {
  if (!status) return null;

  switch (status) {
    case 'processed':
      return (
        <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center" title="Processed">
          <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
        </div>
      );
    case 'processing':
      return (
        <span title="Processing">
          <Loader2 className="h-4 w-4 text-primary animate-spin" />
        </span>
      );
    case 'errored':
      return (
        <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center" title="Error">
          <AlertCircle className="h-2.5 w-2.5 text-white" />
        </div>
      );
    default:
      return null;
  }
}

interface FileListProps {
  folderId: string;
  filters?: FileFilterState;
  onClearFilters?: () => void;
  selectedFileId?: string;
  onSelectFile?: (file: FileType) => void;
}

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();

  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) {
    return FileImage;
  }
  if (['js', 'ts', 'tsx', 'jsx', 'json', 'html', 'css'].includes(ext || '')) {
    return FileCode;
  }
  if (['txt', 'md', 'pdf', 'doc', 'docx'].includes(ext || '')) {
    return FileText;
  }
  return FileIcon;
}

function formatDate(dateString?: string) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function LoadingSkeleton() {
  return (
    <div data-testid="file-loading" className="space-y-1">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-9 rounded bg-surface-2 animate-pulse" />
      ))}
    </div>
  );
}

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

function sortFiles(files: FileType[], sortBy: SortColumn, sortDir: SortDirection): FileType[] {
  const sorted = [...files].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'type':
        comparison = getFileExtension(a.name).localeCompare(getFileExtension(b.name));
        break;
      case 'status': {
        const statusOrder = { processed: 0, processing: 1, errored: 2 };
        const aOrder = a.pipelineStatus ? statusOrder[a.pipelineStatus] ?? 3 : 3;
        const bOrder = b.pipelineStatus ? statusOrder[b.pipelineStatus] ?? 3 : 3;
        comparison = aOrder - bOrder;
        break;
      }
      case 'modified':
        comparison = (a.updatedAt || '').localeCompare(b.updatedAt || '');
        break;
    }
    return sortDir === 'asc' ? comparison : -comparison;
  });
  return sorted;
}

interface SortableHeaderProps {
  column: SortColumn;
  label: string;
  currentSort: SortColumn | null;
  currentDir: SortDirection;
  onSort: (column: SortColumn) => void;
  className?: string;
  align?: 'left' | 'center';
}

function SortableHeader({ column, label, currentSort, currentDir, onSort, className, align = 'left' }: SortableHeaderProps) {
  const isActive = currentSort === column;
  return (
    <th
      className={cn(
        'text-[11px] font-medium text-muted-foreground px-3 py-2 uppercase tracking-wide cursor-pointer hover:text-foreground select-none',
        align === 'center' ? 'text-center' : 'text-left',
        className
      )}
      onClick={() => onSort(column)}
    >
      <span className={cn('inline-flex items-center gap-1', align === 'center' && 'justify-center')}>
        {label}
        {isActive && (
          currentDir === 'asc'
            ? <ArrowUp className="h-3 w-3" />
            : <ArrowDown className="h-3 w-3" />
        )}
      </span>
    </th>
  );
}

export function FileList({ folderId, filters, onClearFilters, selectedFileId, onSelectFile }: FileListProps) {
  const { data: files, isLoading, isError, error, refetch } = useFiles(folderId);
  const [sortBy, setSortBy] = useQueryState('sortBy', parseAsStringLiteral(sortColumns));
  const [sortDir, setSortDir] = useQueryState('sortDir', parseAsStringLiteral(sortDirections).withDefault('asc'));

  const handleSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  if (!folderId) {
    return null;
  }

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError) {
    return (
      <QueryError
        title="Failed to load files"
        message={error?.message || 'An unexpected error occurred'}
        onRetry={() => refetch()}
        size="compact"
      />
    );
  }

  if (!files?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <FileIcon className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm font-medium">No files</p>
        <p className="text-xs">Upload files to this folder to get started</p>
      </div>
    );
  }

  const filteredFiles = filters ? applyFileFilters(files, filters) : files;

  if (filteredFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <FilterX className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm font-medium">No files match your filters</p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="mt-2 text-xs text-primary hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  const displayFiles = sortBy ? sortFiles(filteredFiles, sortBy, sortDir) : filteredFiles;

  return (
    <div data-testid="file-list" className="border border-border rounded overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-1 border-b border-border">
            <SortableHeader column="name" label="Name" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
            <SortableHeader column="type" label="Type" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} className="w-20" />
            <SortableHeader column="status" label="Status" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} className="w-16" align="center" />
            <SortableHeader column="modified" label="Modified" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} className="w-28" />
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {displayFiles.map((file) => {
            const Icon = getFileIcon(file.name);
            const isSelected = selectedFileId === file.id;
            return (
              <tr
                key={file.id}
                onClick={() => onSelectFile?.(file)}
                className={cn(
                  'border-b border-border last:border-b-0',
                  'hover:bg-surface-2 transition-colors duration-75',
                  onSelectFile && 'cursor-pointer',
                  isSelected && 'bg-primary/5 hover:bg-primary/10'
                )}
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2 text-[13px] text-foreground">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{file.name}</span>
                    {file.versionCount && file.versionCount > 1 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 text-muted-foreground shrink-0">
                        v{file.versionCount}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <FileTypeBadge filename={file.name} />
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-center">
                    <PipelineStatusIcon status={file.pipelineStatus} />
                  </div>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {formatDate(file.updatedAt)}
                </td>
                <td className="px-2 py-2">
                  <button className="p-1 rounded hover:bg-surface-3 transition-colors duration-75">
                    <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
