import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { useToast } from './ui/Toast';
import { UploadConfirmDialog } from './UploadConfirmDialog';
import type { Pipeline } from '../lib/api';

const ALLOWED_EXTENSIONS = [
  '.csv',
  '.tsv',
  '.txt',
  '.xls',
  '.xlsx',
  '.xlsm',
  '.xlsb',
];

const ALLOWED_MIME_TYPES = [
  'text/csv',
  'text/tab-separated-values',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel.sheet.macroEnabled.12',
  'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
];

const DEFAULT_MAX_SIZE_MB = 500;

interface FileDropzoneProps {
  onUpload: (files: File[], pipelineId: string | null) => void;
  disabled?: boolean;
  maxSizeMB?: number;
  pipelines?: Pipeline[];
  requirePipeline?: boolean;
}

export function FileDropzone({
  onUpload,
  disabled = false,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  pipelines = [],
  requirePipeline = false,
}: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { error: showError } = useToast();

  const showConfirmDialog = stagedFiles.length > 0;

  const isValidFileType = useCallback((file: File): boolean => {
    // Check MIME type
    if (ALLOWED_MIME_TYPES.includes(file.type)) {
      return true;
    }

    // Check extension as fallback
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return ALLOWED_EXTENSIONS.includes(extension);
  }, []);

  const isValidFileSize = useCallback(
    (file: File): boolean => {
      const maxBytes = maxSizeMB * 1024 * 1024;
      return file.size <= maxBytes;
    },
    [maxSizeMB]
  );

  const validateFiles = useCallback(
    (files: FileList | File[]): File[] => {
      const validFiles: File[] = [];
      const errors: string[] = [];

      Array.from(files as Iterable<File>).forEach((file) => {
        if (!isValidFileType(file)) {
          errors.push(
            `"${file.name}" is not a supported file type. Please use CSV, TSV, Excel, or text files.`
          );
          return;
        }

        if (!isValidFileSize(file)) {
          errors.push(
            `"${file.name}" exceeds the ${maxSizeMB}MB size limit.`
          );
          return;
        }

        validFiles.push(file);
      });

      errors.forEach((err) => showError(err));

      return validFiles;
    },
    [isValidFileType, isValidFileSize, maxSizeMB, showError]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const stageFiles = useCallback(
    (files: File[]) => {
      if (pipelines.length > 0) {
        setStagedFiles(files);
      } else {
        onUpload(files, null);
      }
    },
    [pipelines.length, onUpload]
  );

  const handleConfirmUpload = useCallback(
    (pipelineId: string | null) => {
      onUpload(stagedFiles, pipelineId);
      setStagedFiles([]);
    },
    [stagedFiles, onUpload]
  );

  const handleCancelUpload = useCallback(() => {
    setStagedFiles([]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled) return;

      const files = e.dataTransfer?.files;
      if (!files?.length) return;

      const validFiles = validateFiles(files);
      if (validFiles.length > 0) {
        stageFiles(validFiles);
      }
    },
    [disabled, validateFiles, stageFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;

      const validFiles = validateFiles(files);
      if (validFiles.length > 0) {
        stageFiles(validFiles);
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [validateFiles, stageFiles]
  );

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInputRef.current?.click();
      }
    },
    [disabled]
  );

  return (
    <div
      data-testid="dropzone"
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Drop zone for file upload. Drag and drop files here or press Enter to browse"
      aria-disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-lg p-8 transition-all duration-150 cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-primary/50
        ${
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-muted-foreground/50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input
        ref={fileInputRef}
        data-testid="file-input"
        type="file"
        multiple
        accept={ALLOWED_EXTENSIONS.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      <div className="flex flex-col items-center justify-center gap-3 text-center">
        {isDragOver ? (
          <>
            <div className="p-3 rounded-full bg-primary/10">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm font-medium text-primary">
              Drop files to upload
            </p>
          </>
        ) : (
          <>
            <div className="p-3 rounded-full bg-muted">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Drag and drop files here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                or click to browse
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3" />
              <span>
                CSV, TSV, Excel (.xls, .xlsx), and text files up to {maxSizeMB}
                MB
              </span>
            </div>
          </>
        )}
      </div>

      {showConfirmDialog && (
        <UploadConfirmDialog
          files={stagedFiles}
          pipelines={pipelines}
          onConfirm={handleConfirmUpload}
          onCancel={handleCancelUpload}
          requirePipeline={requirePipeline}
        />
      )}
    </div>
  );
}
