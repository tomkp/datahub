import { useState, useCallback, useMemo } from 'react';

interface Version {
  id: string;
  fileId: string;
  storageUrl: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface UseVersionNavigationOptions {
  onSelect?: (version: Version) => void;
}

export function useVersionNavigation<T extends Version>(
  versions: T[],
  options: UseVersionNavigationOptions = {}
) {
  const { onSelect } = options;
  const [selectedIndex, setSelectedIndex] = useState(versions.length > 0 ? 0 : -1);

  const selectedVersion = useMemo(() => {
    if (selectedIndex < 0 || selectedIndex >= versions.length) {
      return null;
    }
    return versions[selectedIndex];
  }, [versions, selectedIndex]);

  const selectVersion = useCallback(
    (index: number) => {
      if (index >= 0 && index < versions.length) {
        setSelectedIndex(index);
      }
    },
    [versions.length]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent | globalThis.KeyboardEvent) => {
      if (versions.length === 0) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, versions.length - 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Home':
          event.preventDefault();
          setSelectedIndex(0);
          break;
        case 'End':
          event.preventDefault();
          setSelectedIndex(versions.length - 1);
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedVersion && onSelect) {
            onSelect(selectedVersion);
          }
          break;
      }
    },
    [versions.length, selectedVersion, onSelect]
  );

  return {
    selectedIndex,
    selectedVersion,
    selectVersion,
    handleKeyDown,
  };
}
