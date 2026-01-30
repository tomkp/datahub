import { useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Download, Upload, Clock, User, Link2 } from 'lucide-react';
import { useFile, useFileVersions, useUploadFileVersion } from '../hooks/useFiles';
import { usePagination } from '../hooks/usePagination';
import { Pagination } from '../components/ui/Pagination';
import { useToast } from '../components/ui/Toast';
import { useApi } from '../lib/api';

const VERSIONS_PER_PAGE = 20;

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
  const { data: file, isLoading } = useFile(id!);
  const { data: versions } = useFileVersions(id!);
  const {
    paginatedItems: paginatedVersions,
    currentPage,
    totalPages,
    totalItems,
    goToPage,
  } = usePagination(versions, VERSIONS_PER_PAGE);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadVersionMutation = useUploadFileVersion();
  const { success: showSuccess, error: showError } = useToast();
  const api = useApi();

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
    const fileUrl = `${window.location.origin}/files/${id}`;
    try {
      await navigator.clipboard.writeText(fileUrl);
      showSuccess('Link copied to clipboard');
    } catch {
      showError('Failed to copy link');
    }
  }, [id, showSuccess, showError]);

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
                <th className="w-20" />
              </tr>
            </thead>
            <tbody>
              {paginatedVersions.map((version, index) => {
                // Calculate version number: total - ((page-1) * perPage + index)
                const versionNumber =
                  totalItems - ((currentPage - 1) * VERSIONS_PER_PAGE + index);
                const isLatest = currentPage === 1 && index === 0;
                return (
                  <tr
                    key={version.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors duration-150"
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
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
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
