import { useEffect, useCallback } from 'react';
import { X, Calendar, Clock, FileText, Layers } from 'lucide-react';
import { FileTypeBadge } from './FileTypeBadge';
import { Button } from './ui/Button';

interface File {
  id: string;
  name: string;
  dataRoomId: string;
  folderId: string;
  createdAt: string;
  updatedAt: string;
}

interface FileDetailsPanelProps {
  file: File | null;
  versionCount?: number;
  onClose: () => void;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function FileDetailsPanel({ file, versionCount, onClose }: FileDetailsPanelProps) {
  const handleKeyDown = useCallback(
    (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  if (!file) return null;

  return (
    <aside
      role="complementary"
      aria-label="File details"
      className="w-100 border-l border-border bg-background flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">File Details</h2>
        <Button
          variant="ghost"
          size="xs"
          onClick={onClose}
          aria-label="Close panel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* File name and type */}
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <FileText className="h-10 w-10 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-foreground truncate" title={file.name}>
                {file.name}
              </h3>
              <div className="mt-1">
                <FileTypeBadge filename={file.name} />
              </div>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-4">
          {/* Created */}
          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm text-foreground">{formatDate(file.createdAt)}</p>
            </div>
          </div>

          {/* Modified */}
          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Last Modified</p>
              <p className="text-sm text-foreground">{formatDate(file.updatedAt)}</p>
            </div>
          </div>

          {/* Version count */}
          {versionCount !== undefined && (
            <div className="flex items-start gap-3">
              <Layers className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Versions</p>
                <p className="text-sm text-foreground">{versionCount}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
