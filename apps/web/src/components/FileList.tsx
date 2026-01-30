import { Link } from 'react-router-dom';
import { File, FileText, FileImage, FileCode, MoreHorizontal } from 'lucide-react';
import { useFiles } from '../hooks/useFiles';
import { cn } from '../lib/utils';

interface FileListProps {
  folderId: string;
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
    <div data-testid="file-loading" className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-12 rounded-lg bg-muted/50 animate-pulse"
        />
      ))}
    </div>
  );
}

export function FileList({ folderId }: FileListProps) {
  const { data: files, isLoading } = useFiles(folderId);

  if (!folderId) {
    return null;
  }

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!files?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <File className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No files</p>
        <p className="text-sm">Upload files to this folder to get started</p>
      </div>
    );
  }

  return (
    <div data-testid="file-list" className="border border-border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
              Name
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 w-32">
              Modified
            </th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {files.map((file) => {
            const Icon = getFileIcon(file.name);
            return (
              <tr
                key={file.id}
                className={cn(
                  'border-b border-border last:border-b-0',
                  'hover:bg-muted/30 transition-colors duration-150'
                )}
              >
                <td className="px-4 py-3">
                  <Link
                    to={`/files/${file.id}`}
                    className="flex items-center gap-3 text-sm font-medium text-foreground hover:text-primary"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {file.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {formatDate(file.updatedAt)}
                </td>
                <td className="px-2 py-3">
                  <button className="p-1 rounded hover:bg-muted/50">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
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
