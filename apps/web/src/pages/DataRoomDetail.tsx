import { useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, FolderPlus } from 'lucide-react';
import { useDataRoom } from '../hooks/useDataRooms';
import { useCreateFolder } from '../hooks/useFolders';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useFileUpload } from '../hooks/useFileUpload';
import { FileTree } from '../components/FileTree';
import { FileList } from '../components/FileList';
import { FileDropzone } from '../components/FileDropzone';
import { UploadProgress } from '../components/UploadProgress';
import { FileFilters, type FileFilterState } from '../components/FileFilters';
import { QueryError } from '../components/ui';
import { useToast } from '../components/ui/Toast';

export function DataRoomDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: dataRoom, isLoading, isError, error, refetch } = useDataRoom(id!);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [folderName, setFolderName] = useState('');
  const { success: showSuccess, error: showError } = useToast();

  useDocumentTitle(dataRoom?.name);

  // Parse filters from URL
  const filters: FileFilterState = {
    fileTypes: searchParams.get('types')?.split(',').filter(Boolean),
    dateRange: searchParams.get('date') as FileFilterState['dateRange'],
  };

  const handleFiltersChange = (newFilters: FileFilterState) => {
    const params = new URLSearchParams();
    if (newFilters.fileTypes?.length) {
      params.set('types', newFilters.fileTypes.join(','));
    }
    if (newFilters.dateRange) {
      params.set('date', newFilters.dateRange);
    }
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setSearchParams({});
  };

  const createFolderMutation = useCreateFolder();
  const { uploads, uploadFiles, clearCompleted } = useFileUpload(selectedFolderId);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim() || !id) return;

    try {
      await createFolderMutation.mutateAsync({
        dataRoomId: id,
        data: {
          name: folderName.trim(),
          parentId: selectedFolderId || undefined,
        },
      });
      showSuccess(`Folder "${folderName.trim()}" created`);
      setFolderName('');
      setShowCreateFolder(false);
    } catch {
      showError('Failed to create folder');
    }
  };

  const handleFilesUpload = async (files: File[]) => {
    if (!selectedFolderId) {
      showError('Please select a folder first');
      return;
    }
    await uploadFiles(files);
    const completedCount = files.length;
    if (completedCount > 0) {
      showSuccess(
        `${completedCount} file${completedCount > 1 ? 's' : ''} uploaded`
      );
    }
  };

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
          title="Failed to load data room"
          message={error?.message || 'An unexpected error occurred'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!dataRoom) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">Data room not found</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link to="/data-rooms" className="hover:text-foreground">
            Data Rooms
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{dataRoom.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">
            {dataRoom.name}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateFolder(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 text-sm transition-colors duration-150"
            >
              <FolderPlus className="h-4 w-4" />
              New Folder
            </button>
          </div>
        </div>
      </div>

      {/* Create folder modal */}
      {showCreateFolder && (
        <div className="border-b border-border px-6 py-4 bg-muted/30">
          <form onSubmit={handleCreateFolder} className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-2">
                Folder Name
              </label>
              <input
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Enter folder name"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCreateFolder(false)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-muted/50 text-sm transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createFolderMutation.isPending || !folderName.trim()}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 text-sm transition-colors duration-150"
              >
                {createFolderMutation.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar - Folder tree */}
        <div className="w-64 border-r border-border overflow-y-auto">
          <FileTree
            dataRoomId={id!}
            onSelectFolder={setSelectedFolderId}
            selectedFolderId={selectedFolderId}
          />
        </div>

        {/* Main content - File list */}
        <div className="flex-1 p-6 overflow-y-auto">
          {selectedFolderId ? (
            <div className="space-y-4">
              {/* Drag and Drop Upload Zone */}
              <FileDropzone
                onUpload={handleFilesUpload}
                disabled={!selectedFolderId}
              />

              {/* Upload Progress */}
              {uploads.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      Uploads
                    </span>
                    {uploads.some((u) => u.status === 'completed') && (
                      <button
                        onClick={clearCompleted}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Clear completed
                      </button>
                    )}
                  </div>
                  <UploadProgress uploads={uploads} />
                </div>
              )}

              {/* File Filters */}
              <FileFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />

              {/* File List */}
              <FileList
                folderId={selectedFolderId}
                filters={filters}
                onClearFilters={handleClearFilters}
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Select a folder to view files
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
