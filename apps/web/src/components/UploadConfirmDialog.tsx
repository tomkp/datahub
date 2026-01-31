import { useState, useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import { Button } from './ui/Button';
import { PipelineSelector } from './PipelineSelector';
import type { Pipeline } from '../lib/api';

interface UploadConfirmDialogProps {
  files: File[];
  pipelines: Pipeline[];
  onConfirm: (pipelineId: string | null) => void;
  onCancel: () => void;
  requirePipeline?: boolean;
}

export function UploadConfirmDialog({
  files,
  pipelines,
  onConfirm,
  onCancel,
  requirePipeline = false,
}: UploadConfirmDialogProps) {
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleConfirm = () => {
    onConfirm(selectedPipelineId);
  };

  const canConfirm = !requirePipeline || selectedPipelineId !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-label="Upload confirmation"
        aria-modal="true"
        className="relative bg-background border border-border rounded-lg shadow-lg w-full max-w-md mx-4 p-6"
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-semibold text-foreground mb-4">
          Upload {files.length === 1 ? 'File' : `${files.length} Files`}
        </h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Files</label>
            <div className="border border-border rounded-lg divide-y divide-border max-h-32 overflow-y-auto">
              {files.map((file, index) => (
                <div key={index} className="flex items-center gap-2 px-3 py-2">
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-foreground truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {formatFileSize(file.size)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {pipelines.length > 0 && (
            <PipelineSelector
              pipelines={pipelines}
              selectedPipelineId={selectedPipelineId}
              onSelect={setSelectedPipelineId}
              required={requirePipeline}
            />
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              disabled={!canConfirm}
            >
              Upload
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
