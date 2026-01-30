import { useRef, useCallback, useState } from 'react';
import { Download, Upload, Clock, User, Link2, GitBranch, X } from 'lucide-react';
import { useFile, useFileVersions, useUploadFileVersion } from '../hooks/useFiles';
import { usePipelineRunByFileVersion } from '../hooks/usePipelines';
import { PipelineProgress, StatusBadge } from '../components';
import { useToast } from '../components/ui/Toast';
import { useApi, type FileVersion } from '../lib/api';

interface FileDetailSidebarProps {
  fileId: string;
  onClose: () => void;
}

function formatDate(dateString?: string) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function FileDetailSidebar({ fileId, onClose }: FileDetailSidebarProps) {
  const { data: file, isLoading, isError } = useFile(fileId);
  const { data: versions } = useFileVersions(fileId);
  const [selectedVersion, setSelectedVersion] = useState<FileVersion | null>(null);
  const activeVersion = selectedVersion || versions?.[0];
  const { data: pipelineRun } = usePipelineRunByFileVersion(activeVersion?.id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadVersionMutation = useUploadFileVersion();
  const { success: showSuccess, error: showError } = useToast();
  const api = useApi();

  const handleUploadVersion = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !fileId) return;

    try {
      await uploadVersionMutation.mutateAsync({
        fileId,
        file: files[0],
      });
      showSuccess('New version uploaded');
    } catch {
      showError('Failed to upload version');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCopyLink = useCallback(async () => {
    const fileUrl = `${window.location.origin}/files/${fileId}`;
    try {
      await navigator.clipboard.writeText(fileUrl);
      showSuccess('Link copied to clipboard');
    } catch {
      showError('Failed to copy link');
    }
  }, [fileId, showSuccess, showError]);

  const handleDownload = useCallback(() => {
    if (!versions?.length) return;
    const latestVersion = versions[0];
    const downloadUrl = `${api.baseUrl}/api/file-versions/${latestVersion.id}/download`;
    window.open(downloadUrl, '_blank');
  }, [versions, api.baseUrl]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isError || !file) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">Failed to load file</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground truncate pr-2">{file.name}</h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded hover:bg-muted/50 transition-colors"
          title="Close"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors duration-150 text-xs"
            title="Copy link to file"
          >
            <Link2 className="h-3.5 w-3.5" />
            Copy Link
          </button>
          <button
            onClick={handleDownload}
            disabled={!versions?.length}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted/50 disabled:opacity-50 transition-colors duration-150 text-xs"
            title="Download latest version"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150 text-xs"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload Version
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleUploadVersion}
            className="hidden"
          />
        </div>

        {/* File info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border p-3 bg-card">
            <p className="text-xs text-muted-foreground mb-0.5">Created</p>
            <p className="text-sm text-foreground">{formatDate(file.createdAt)}</p>
          </div>
          <div className="rounded-lg border border-border p-3 bg-card">
            <p className="text-xs text-muted-foreground mb-0.5">Modified</p>
            <p className="text-sm text-foreground">{formatDate(file.updatedAt)}</p>
          </div>
        </div>

        {/* Pipeline Progress */}
        {activeVersion && (
          <div className="rounded-lg border border-border p-3 bg-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-foreground">Pipeline Status</h3>
              </div>
              {pipelineRun && (
                <StatusBadge status={pipelineRun.status} />
              )}
            </div>
            {pipelineRun?.runSteps ? (
              <PipelineProgress
                steps={pipelineRun.runSteps.map((step) => ({
                  step: step.step,
                  status: step.status,
                  startedAt: step.createdAt,
                  completedAt: step.status === 'processed' || step.status === 'errored' ? step.updatedAt : undefined,
                  errorMessage: step.errorMessage,
                }))}
              />
            ) : (
              <p className="text-xs text-muted-foreground">
                No pipeline run for this version
              </p>
            )}
          </div>
        )}

        {/* Version history */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-2">Version History</h3>
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              {versions?.map((version, index) => {
                const versionNumber = (versions?.length || 0) - index;
                const isLatest = index === 0;
                const isSelected = activeVersion?.id === version.id;
                return (
                  <div
                    key={version.id}
                    onClick={() => setSelectedVersion(version)}
                    className={`p-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors duration-150 cursor-pointer ${
                      isSelected ? 'bg-primary/5 hover:bg-primary/10' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          v{versionNumber}
                        </span>
                        {isLatest && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                            Latest
                          </span>
                        )}
                      </div>
                      <a
                        href={`${api.baseUrl}/api/file-versions/${version.id}/download`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded hover:bg-muted/50"
                        title="Download"
                      >
                        <Download className="h-3.5 w-3.5 text-muted-foreground" />
                      </a>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(version.uploadedAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {version.uploadedBy}
                      </div>
                    </div>
                  </div>
                );
              })}
              {!versions?.length && (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No versions found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
