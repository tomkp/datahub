import { useState } from 'react';
import { Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react';
import { useFolders } from '../hooks/useFolders';
import { cn } from '../lib/utils';
import type { Folder as FolderType } from '../lib/api';

interface FileTreeProps {
  dataRoomId: string;
  onSelectFolder?: (folderId: string) => void;
  selectedFolderId?: string;
}

function FolderItem({
  folder,
  folders,
  level = 0,
  onSelectFolder,
  selectedFolderId,
}: {
  folder: FolderType;
  folders: FolderType[];
  level?: number;
  onSelectFolder?: (folderId: string) => void;
  selectedFolderId?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const children = folders.filter((f) => f.parentId === folder.id);
  const hasChildren = children.length > 0;
  const isSelected = selectedFolderId === folder.id;

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
    onSelectFolder?.(folder.id);
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm',
          'hover:bg-muted/50 transition-colors duration-150',
          isSelected && 'bg-primary/10 text-primary'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )
        ) : (
          <span className="w-4 shrink-0" />
        )}
        {isExpanded ? (
          <FolderOpen className="h-4 w-4 text-primary shrink-0" />
        ) : (
          <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
        <span className="truncate">{folder.name}</span>
      </button>
      {isExpanded && hasChildren && (
        <div>
          {children.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              folders={folders}
              level={level + 1}
              onSelectFolder={onSelectFolder}
              selectedFolderId={selectedFolderId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({ dataRoomId, onSelectFolder, selectedFolderId }: FileTreeProps) {
  const { data: folders, isLoading } = useFolders(dataRoomId);

  if (isLoading) {
    return (
      <div data-testid="folder-loading" className="space-y-2 p-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-8 rounded-md bg-muted/50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!folders?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
        <Folder className="h-8 w-8 mb-2 opacity-50" />
        <p>No folders</p>
      </div>
    );
  }

  // Get root folders (no parentId)
  const rootFolders = folders.filter((f) => !f.parentId);

  return (
    <div className="py-2">
      {rootFolders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          folders={folders}
          onSelectFolder={onSelectFolder}
          selectedFolderId={selectedFolderId}
        />
      ))}
    </div>
  );
}
