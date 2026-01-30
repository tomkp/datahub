import { Link } from 'react-router-dom';
import { File, FileText, FileImage, FileCode, MoreHorizontal, FilterX } from 'lucide-react';
import { useFiles } from '../hooks/useFiles';
import { cn } from '../lib/utils';
import { applyFileFilters, type FileFilterState } from './FileFilters';
import { FileTypeBadge } from './FileTypeBadge';
import { QueryError } from './ui';

interface FileListProps {
  folderId: string;
  filters?: FileFilterState;
  onClearFilters?: () => void;
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
  return File;
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

export function FileList({ folderId, filters, onClearFilters }: FileListProps) {
  const { data: files, isLoading, isError, error, refetch } = useFiles(folderId);

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
        <File className="h-8 w-8 mb-2 opacity-40" />
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

  const displayFiles = filteredFiles;

  return (
    <div data-testid="file-list" className="border border-border rounded overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-1 border-b border-border">
            <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2 uppercase tracking-wide">
              Name
            </th>
            <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2 uppercase tracking-wide w-20">
              Type
            </th>
            <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2 uppercase tracking-wide w-28">
              Modified
            </th>
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {displayFiles.map((file) => {
            const Icon = getFileIcon(file.name);
            return (
              <tr
                key={file.id}
                className={cn(
                  'border-b border-border last:border-b-0',
                  'hover:bg-surface-2 transition-colors duration-75'
                )}
              >
                <td className="px-3 py-2">
                  <Link
                    to={`/files/${file.id}`}
                    className="flex items-center gap-2 text-[13px] text-foreground hover:text-primary transition-colors"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <FileTypeBadge filename={file.name} />
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
