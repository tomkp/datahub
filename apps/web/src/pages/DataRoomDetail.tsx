import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, FolderPlus, GitBranch, PanelLeft } from 'lucide-react';
import { useQueryState, parseAsBoolean, parseAsString, parseAsArrayOf, parseAsStringLiteral } from 'nuqs';
import { useDataRoom } from '../hooks/useDataRooms';
import { useCreateFolder } from '../hooks/useFolders';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useFileUpload } from '../hooks/useFileUpload';
import { usePipelines } from '../hooks/usePipelines';
import { FileTree } from '../components/FileTree';
import { FileList } from '../components/FileList';
import { FileDropzone } from '../components/FileDropzone';
import { UploadProgress } from '../components/UploadProgress';
import { FileFilters, type FileFilterState } from '../components/FileFilters';
import { FileDetailSidebar } from '../components/FileDetailSidebar';
import { QueryError } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import { cn } from '../lib/utils';

const dateRangeValues = ['today', 'last7days', 'last30days', 'all'] as const;

export function DataRoomDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: dataRoom, isLoading, isError, error, refetch } = useDataRoom(id!);

  // URL state management with nuqs
  const [showCreateFolder, setShowCreateFolder] = useQueryState('createFolder', parseAsBoolean.withDefault(false));
  const [selectedFolderId, setSelectedFolderId] = useQueryState('folder', parseAsString.withDefault(''));
  const [selectedFileId, setSelectedFileId] = useQueryState('file', parseAsString.withDefault(''));
  const [filterTypes, setFilterTypes] = useQueryState('types', parseAsArrayOf(parseAsString, ',').withDefault([]));
  const [filterDateRange, setFilterDateRange] = useQueryState('date', parseAsStringLiteral(dateRangeValues));

  // Local state for form inputs and responsive UI
  const [folderName, setFolderName] = useState('');
  const [fileTreeOpen, setFileTreeOpen] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  useDocumentTitle(dataRoom?.name);

  // Handler that clears file selection when folder changes
  const handleFolderChange = useCallback((folderId: string) => {
    setSelectedFolderId(folderId);
    setSelectedFileId('');
  }, [setSelectedFolderId, setSelectedFileId]);

  // Build filters object from URL state
  const filters: FileFilterState = {
    fileTypes: filterTypes.length > 0 ? filterTypes.filter(Boolean) : undefined,
    dateRange: filterDateRange as FileFilterState['dateRange'],
  };

  const handleFiltersChange = useCallback((newFilters: FileFilterState) => {
    setFilterTypes(newFilters.fileTypes?.length ? newFilters.fileTypes : []);
    setFilterDateRange(newFilters.dateRange || null);
  }, [setFilterTypes, setFilterDateRange]);

  const handleClearFilters = useCallback(() => {
    setFilterTypes([]);
    setFilterDateRange(null);
  }, [setFilterTypes, setFilterDateRange]);

  const createFolderMutation = useCreateFolder();
  const { uploads, uploadFiles, clearCompleted } = useFileUpload(selectedFolderId);
  const { data: pipelines } = usePipelines(id!);

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

  const handleFilesUpload = async (files: File[], pipelineId: string | null) => {
    if (!selectedFolderId) {
      showError('Please select a folder first');
      return;
    }
    await uploadFiles(files, pipelineId);
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
      <div className="border-b border-border px-4 lg:px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link to="/data-rooms" className="hover:text-foreground">
            Data Rooms
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{dataRoom.name}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* File tree toggle button - visible on mobile, hidden on desktop */}
            <button
              onClick={() => setFileTreeOpen(!fileTreeOpen)}
              aria-label="Toggle file tree"
              className="lg:hidden p-2 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
            <h1 className="text-xl font-semibold text-foreground">
              {dataRoom.name}
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/pipelines?dataRoom=${id}`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 text-sm transition-colors duration-150"
            >
              <GitBranch className="h-4 w-4" />
              <span className="hidden sm:inline">Pipelines</span>
            </Link>
            <button
              onClick={() => setShowCreateFolder(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 text-sm transition-colors duration-150"
            >
              <FolderPlus className="h-4 w-4" />
              <span className="hidden sm:inline">New Folder</span>
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
      <div className="flex-1 flex min-h-0 relative">
        {/* Backdrop - only visible on mobile when file tree is open */}
        {fileTreeOpen && (
          <div
            data-testid="file-tree-backdrop"
            onClick={() => setFileTreeOpen(false)}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          />
        )}

        {/* Sidebar - Folder tree */}
        <div
          data-testid="file-tree-container"
          className={cn(
            'w-64 border-r border-border overflow-y-auto bg-surface-1',
            'fixed lg:static inset-y-0 left-0 top-0 z-40',
            'transition-transform duration-200 ease-in-out',
            'lg:translate-x-0',
            fileTreeOpen ? 'translate-x-0' : '-translate-x-full',
            'hidden lg:block'
          )}
        >
          <FileTree
            dataRoomId={id!}
            onSelectFolder={(folderId) => {
              handleFolderChange(folderId);
              setFileTreeOpen(false);
            }}
            selectedFolderId={selectedFolderId}
          />
        </div>

        {/* Main content - File list */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {selectedFolderId ? (
            <div className="space-y-4">
              {/* Drag and Drop Upload Zone */}
              <FileDropzone
                onUpload={handleFilesUpload}
                disabled={!selectedFolderId}
                pipelines={pipelines || []}
                requirePipeline={false}
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
                selectedFileId={selectedFileId}
                onSelectFile={(file) => setSelectedFileId(file.id)}
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Select a folder to view files
            </div>
          )}
        </div>

        {/* Right sidebar - File details (drawer on mobile) */}
        {selectedFileId && (
          <div
            data-testid="file-details-panel"
            className={cn(
              'w-full lg:w-100 border-l border-border overflow-y-auto bg-background',
              'fixed lg:static inset-0 z-50 lg:z-auto'
            )}
          >
            <FileDetailSidebar
              fileId={selectedFileId}
              onClose={() => setSelectedFileId('')}
            />
          </div>
        )}
      </div>
    </div>
  );
}
