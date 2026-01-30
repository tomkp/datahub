import { useRef, useCallback, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, Download, Upload, Clock, User, Link2, GitBranch } from 'lucide-react';
import { useFile, useFileVersions, useUploadFileVersion } from '../hooks/useFiles';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { usePagination } from '../hooks/usePagination';
import { usePipelineRunByFileVersion } from '../hooks/usePipelines';
import { Pagination } from '../components/ui/Pagination';
import { QueryError } from '../components/ui';
import { PipelineProgress, StatusBadge } from '../components';
import { useToast } from '../components/ui/Toast';
import { useApi, type FileVersion } from '../lib/api';

const VERSIONS_PER_PAGE = 20;

function VersionStatusBadge({ versionId }: { versionId: string }) {
  const { data: pipelineRun, isLoading } = usePipelineRunByFileVersion(versionId);

  if (isLoading) {
    return <span className="text-xs text-muted-foreground">...</span>;
  }

  if (!pipelineRun) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  return <StatusBadge status={pipelineRun.status} size="sm" />;
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

export function FileDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: file, isLoading, isError, error, refetch } = useFile(id!);
  const { data: versions } = useFileVersions(id!);
  const {
    paginatedItems: paginatedVersions,
    currentPage,
    totalPages,
    totalItems,
    goToPage,
  } = usePagination(versions, VERSIONS_PER_PAGE);

  // Get selected version from URL or default to latest
  const versionIdFromUrl = searchParams.get('version');
  const selectedVersion = versions?.find((v) => v.id === versionIdFromUrl);
  const activeVersion = selectedVersion || versions?.[0];

  // Update URL when selecting a version
  const setSelectedVersion = useCallback(
    (version: FileVersion | null) => {
      if (version && versions?.[0]?.id !== version.id) {
        setSearchParams({ version: version.id }, { replace: true });
      } else {
        // Remove version param when selecting latest (default)
        setSearchParams({}, { replace: true });
      }
    },
    [setSearchParams, versions]
  );

  // Clear version param if it doesn't match any version
  useEffect(() => {
    if (versionIdFromUrl && versions && !versions.find((v) => v.id === versionIdFromUrl)) {
      setSearchParams({}, { replace: true });
    }
  }, [versionIdFromUrl, versions, setSearchParams]);
  const { data: pipelineRun } = usePipelineRunByFileVersion(activeVersion?.id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadVersionMutation = useUploadFileVersion();
  const { success: showSuccess, error: showError } = useToast();
  const api = useApi();

  useDocumentTitle(file?.name);

  const handleUploadVersion = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !id) return;

    try {
      await uploadVersionMutation.mutateAsync({
        fileId: id,
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
    const versionParam = selectedVersion ? `?version=${selectedVersion.id}` : '';
    const fileUrl = `${window.location.origin}/files/${id}${versionParam}`;
    try {
      await navigator.clipboard.writeText(fileUrl);
      showSuccess('Link copied to clipboard');
    } catch {
      showError('Failed to copy link');
    }
  }, [id, selectedVersion, showSuccess, showError]);

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

  if (isError) {
    return (
      <div className="h-full flex items-center justify-center">
        <QueryError
          title="Failed to load file"
          message={error?.message || 'An unexpected error occurred'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">File not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link to="/data-rooms" className="hover:text-foreground">
            Data Rooms
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link to={`/data-rooms/${file.dataRoomId}`} className="hover:text-foreground">
            Data Room
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{file.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">{file.name}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors duration-150 text-sm"
              title="Copy link to file"
            >
              <Link2 className="h-4 w-4" />
              Copy Link
            </button>
            <button
              onClick={handleDownload}
              disabled={!versions?.length}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted/50 disabled:opacity-50 transition-colors duration-150 text-sm"
              title="Download latest version"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150 text-sm"
            >
              <Upload className="h-4 w-4" />
              Upload Version
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleUploadVersion}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* File info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border p-4 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Created</p>
          <p className="text-foreground">{formatDate(file.createdAt)}</p>
        </div>
        <div className="rounded-lg border border-border p-4 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Last Modified</p>
          <p className="text-foreground">{formatDate(file.updatedAt)}</p>
        </div>
      </div>

      {/* Pipeline Progress */}
      {activeVersion && (
        <div className="rounded-lg border border-border p-4 bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-medium text-foreground">Pipeline Status</h2>
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
            <p className="text-sm text-muted-foreground">
              No pipeline run for this version
            </p>
          )}
        </div>
      )}

      {/* Version history */}
      <div>
        <h2 className="text-lg font-medium text-foreground mb-4">Version History</h2>
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                  Version
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                  Uploaded
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                  Uploaded By
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                  Status
                </th>
                <th className="w-20" />
              </tr>
            </thead>
            <tbody>
              {paginatedVersions.map((version, index) => {
                // Calculate version number: total - ((page-1) * perPage + index)
                const versionNumber =
                  totalItems - ((currentPage - 1) * VERSIONS_PER_PAGE + index);
                const isLatest = currentPage === 1 && index === 0;
                const isSelected = activeVersion?.id === version.id;
                return (
                  <tr
                    key={version.id}
                    onClick={() => setSelectedVersion(version)}
                    className={`border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors duration-150 cursor-pointer ${
                      isSelected ? 'bg-primary/5 hover:bg-primary/10' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          v{versionNumber}
                        </span>
                        {isLatest && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            Latest
                          </span>
                        )}
                        {isSelected && !isLatest && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-muted-foreground">
                            Selected
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {formatDate(version.uploadedAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        {version.uploadedBy}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <VersionStatusBadge versionId={version.id} />
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/api/file-versions/${version.id}/download`}
                        className="flex items-center justify-center p-2 rounded hover:bg-muted/50"
                        title="Download"
                      >
                        <Download className="h-4 w-4 text-muted-foreground" />
                      </a>
                    </td>
                  </tr>
                );
              })}
              {!versions?.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No versions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={VERSIONS_PER_PAGE}
          onPageChange={goToPage}
        />
      </div>
    </div>
  );
}
