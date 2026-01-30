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
          'flex items-center gap-1.5 w-full px-2 py-1 rounded text-[13px]',
          'hover:bg-surface-2 transition-colors duration-75',
          isSelected && 'bg-primary/10 text-primary'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
          )
        ) : (
          <span className="w-3 shrink-0" />
        )}
        {isExpanded ? (
          <FolderOpen className="h-3.5 w-3.5 text-primary shrink-0" />
        ) : (
          <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
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
      <div data-testid="folder-loading" className="space-y-1 p-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-7 rounded bg-surface-2 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!folders?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-muted-foreground text-xs">
        <Folder className="h-6 w-6 mb-1.5 opacity-40" />
        <p>No folders</p>
      </div>
    );
  }

  // Get root folders (no parentId)
  const rootFolders = folders.filter((f) => !f.parentId);

  return (
    <div className="py-1">
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
