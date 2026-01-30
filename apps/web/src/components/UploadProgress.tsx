import { CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';

export interface UploadItem {
  id: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface UploadProgressProps {
  uploads: UploadItem[];
}

export function UploadProgress({ uploads }: UploadProgressProps) {
  if (uploads.length === 0) {
    return null;
  }

  return (
    <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
      {uploads.map((upload) => (
        <div key={upload.id} className="p-3 bg-surface-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground truncate">
              {upload.fileName}
            </span>
            <StatusBadge status={upload.status} error={upload.error} />
          </div>

          {upload.status === 'uploading' && (
            <div
              role="progressbar"
              aria-valuenow={upload.progress}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-1.5 bg-muted rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${upload.progress}%` }}
              />
            </div>
          )}

          {upload.status === 'error' && upload.error && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {upload.error}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({
  status,
  error,
}: {
  status: UploadItem['status'];
  error?: string;
}) {
  switch (status) {
    case 'pending':
      return (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Pending
        </span>
      );
    case 'uploading':
      return (
        <span className="flex items-center gap-1 text-xs text-primary">
          <Loader2 className="h-3 w-3 animate-spin" />
          Uploading
        </span>
      );
    case 'completed':
      return (
        <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
          <CheckCircle className="h-3 w-3" />
          Completed
        </span>
      );
    case 'error':
      return (
        <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="h-3 w-3" />
          {error ? 'Upload failed' : 'Error'}
        </span>
      );
    default:
      return null;
  }
}
