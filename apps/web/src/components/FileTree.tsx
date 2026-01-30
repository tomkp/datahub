import { useState, useCallback, useRef, useEffect } from 'react';
import { Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react';
import { useFolders } from '../hooks/useFolders';
import { cn } from '../lib/utils';
import type { Folder as FolderType } from '../lib/api';

interface FileTreeProps {
  dataRoomId: string;
  onSelectFolder?: (folderId: string) => void;
  selectedFolderId?: string;
}

interface FolderItemProps {
  folder: FolderType;
  folders: FolderType[];
  level?: number;
  onSelectFolder?: (folderId: string) => void;
  selectedFolderId?: string;
  expandedFolders: Set<string>;
  onToggleExpand: (folderId: string) => void;
  onKeyDown: (e: React.KeyboardEvent, folderId: string) => void;
  itemRefs: React.MutableRefObject<Map<string, HTMLButtonElement>>;
}

function FolderItem({
  folder,
  folders,
  level = 0,
  onSelectFolder,
  selectedFolderId,
  expandedFolders,
  onToggleExpand,
  onKeyDown,
  itemRefs,
}: FolderItemProps) {
  const children = folders.filter((f) => f.parentId === folder.id);
  const hasChildren = children.length > 0;
  const isSelected = selectedFolderId === folder.id;
  const isExpanded = expandedFolders.has(folder.id);

  const handleClick = () => {
    if (hasChildren) {
      onToggleExpand(folder.id);
    }
    onSelectFolder?.(folder.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    onKeyDown(e, folder.id);
  };

  const setRef = (el: HTMLButtonElement | null) => {
    if (el) {
      itemRefs.current.set(folder.id, el);
    } else {
      itemRefs.current.delete(folder.id);
    }
  };

  return (
    <div role="group">
      <button
        ref={setRef}
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={hasChildren ? isExpanded : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex items-center gap-1.5 w-full px-2 py-1 rounded text-[13px]',
          'hover:bg-surface-2 transition-colors duration-75',
          'focus:outline-none focus:ring-2 focus:ring-primary/50',
          isSelected && 'bg-primary/10 text-primary'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden="true" />
          )
        ) : (
          <span className="w-3 shrink-0" aria-hidden="true" />
        )}
        {isExpanded ? (
          <FolderOpen className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
        ) : (
          <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
        )}
        <span className="truncate">{folder.name}</span>
      </button>
      {isExpanded && hasChildren && (
        <div role="group" aria-label={`Contents of ${folder.name}`}>
          {children.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              folders={folders}
              level={level + 1}
              onSelectFolder={onSelectFolder}
              selectedFolderId={selectedFolderId}
              expandedFolders={expandedFolders}
              onToggleExpand={onToggleExpand}
              onKeyDown={onKeyDown}
              itemRefs={itemRefs}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Get visible folders in order (respecting expanded state)
function getVisibleFolders(
  folders: FolderType[],
  expandedFolders: Set<string>,
  parentId?: string
): FolderType[] {
  const children = folders.filter((f) => f.parentId === parentId);
  const result: FolderType[] = [];

  for (const folder of children) {
    result.push(folder);
    if (expandedFolders.has(folder.id)) {
      result.push(...getVisibleFolders(folders, expandedFolders, folder.id));
    }
  }

  return result;
}

export function FileTree({ dataRoomId, onSelectFolder, selectedFolderId }: FileTreeProps) {
  const { data: folders, isLoading } = useFolders(dataRoomId);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const toggleExpand = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, folderId: string) => {
      if (!folders) return;

      const visibleFolders = getVisibleFolders(folders, expandedFolders);
      const currentIndex = visibleFolders.findIndex((f) => f.id === folderId);
      const currentFolder = visibleFolders[currentIndex];

      if (currentIndex === -1 || !currentFolder) return;

      const hasChildren = folders.some((f) => f.parentId === folderId);
      const isExpanded = expandedFolders.has(folderId);

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const nextFolder = visibleFolders[currentIndex + 1];
          if (nextFolder) {
            const nextElement = itemRefs.current.get(nextFolder.id);
            nextElement?.focus();
          }
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const prevFolder = visibleFolders[currentIndex - 1];
          if (prevFolder) {
            const prevElement = itemRefs.current.get(prevFolder.id);
            prevElement?.focus();
          }
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          if (hasChildren && !isExpanded) {
            toggleExpand(folderId);
          } else if (hasChildren && isExpanded) {
            // Move to first child
            const children = folders.filter((f) => f.parentId === folderId);
            if (children.length > 0) {
              const firstChildElement = itemRefs.current.get(children[0].id);
              firstChildElement?.focus();
            }
          }
          break;
        }
        case 'ArrowLeft': {
          e.preventDefault();
          if (hasChildren && isExpanded) {
            toggleExpand(folderId);
          } else if (currentFolder.parentId) {
            // Move to parent
            const parentElement = itemRefs.current.get(currentFolder.parentId);
            parentElement?.focus();
          }
          break;
        }
        case 'Enter':
        case ' ': {
          e.preventDefault();
          onSelectFolder?.(folderId);
          if (hasChildren) {
            toggleExpand(folderId);
          }
          break;
        }
        case 'Home': {
          e.preventDefault();
          const firstFolder = visibleFolders[0];
          if (firstFolder) {
            const firstElement = itemRefs.current.get(firstFolder.id);
            firstElement?.focus();
          }
          break;
        }
        case 'End': {
          e.preventDefault();
          const lastFolder = visibleFolders[visibleFolders.length - 1];
          if (lastFolder) {
            const lastElement = itemRefs.current.get(lastFolder.id);
            lastElement?.focus();
          }
          break;
        }
      }
    },
    [folders, expandedFolders, toggleExpand, onSelectFolder]
  );

  // Clear refs when folders change
  useEffect(() => {
    itemRefs.current.clear();
  }, [folders]);

  if (isLoading) {
    return (
      <div
        data-testid="folder-loading"
        className="space-y-1 p-2"
        aria-busy="true"
        aria-label="Loading folders"
      >
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-7 rounded bg-surface-2 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!folders?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-muted-foreground text-xs">
        <Folder className="h-6 w-6 mb-1.5 opacity-40" aria-hidden="true" />
        <p>No folders</p>
      </div>
    );
  }

  // Get root folders (no parentId)
  const rootFolders = folders.filter((f) => !f.parentId);

  return (
    <div role="tree" aria-label="Folder navigation" className="py-1">
      {rootFolders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          folders={folders}
          onSelectFolder={onSelectFolder}
          selectedFolderId={selectedFolderId}
          expandedFolders={expandedFolders}
          onToggleExpand={toggleExpand}
          onKeyDown={handleKeyDown}
          itemRefs={itemRefs}
        />
      ))}
    </div>
  );
}
