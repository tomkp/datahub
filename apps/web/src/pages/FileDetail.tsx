import { useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Download, Upload, Clock, User } from 'lucide-react';
import { useFile, useFileVersions, useUploadFileVersion } from '../hooks/useFiles';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadVersionMutation = useUploadFileVersion();

  const handleUploadVersion = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !id) return;

    await uploadVersionMutation.mutateAsync({
      fileId: id,
      file: files[0],
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors duration-150"
            >
              <Upload className="h-4 w-4" />
              Upload New Version
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
              {versions?.map((version, index) => (
                <tr
                  key={version.id}
                  className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors duration-150"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        v{versions.length - index}
                      </span>
                      {index === 0 && (
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
              ))}
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
      </div>
    </div>
  );
}
