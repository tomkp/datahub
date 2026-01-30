import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Upload, FolderPlus } from 'lucide-react';
import { useDataRoom } from '../hooks/useDataRooms';
import { useCreateFolder } from '../hooks/useFolders';
import { useUploadFile } from '../hooks/useFiles';
import { FileTree } from '../components/FileTree';
import { FileList } from '../components/FileList';

export function DataRoomDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: dataRoom, isLoading } = useDataRoom(id!);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [folderName, setFolderName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createFolderMutation = useCreateFolder();
  const uploadFileMutation = useUploadFile();

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim() || !id) return;

    await createFolderMutation.mutateAsync({
      dataRoomId: id,
      data: {
        name: folderName.trim(),
        parentId: selectedFolderId || undefined,
      },
    });

    setFolderName('');
    setShowCreateFolder(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !selectedFolderId) return;

    for (const file of files) {
      await uploadFileMutation.mutateAsync({
        folderId: selectedFolderId,
        file,
      });
    }

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
          <h1 className="text-xl font-semibold text-foreground">{dataRoom.name}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateFolder(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 text-sm transition-colors duration-150"
            >
              <FolderPlus className="h-4 w-4" />
              New Folder
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!selectedFolderId}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 text-sm transition-colors duration-150"
            >
              <Upload className="h-4 w-4" />
              Upload
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
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
            <FileList folderId={selectedFolderId} />
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
