import { useState, useCallback } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Button } from './ui/Button';

export interface ChangelogEntry {
  date: string;
  title: string;
  description: string;
}

interface WhatsNewProps {
  changelog: ChangelogEntry[];
  onClose: () => void;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function WhatsNew({ changelog, onClose }: WhatsNewProps) {
  return (
    <div
      role="dialog"
      aria-label="What's New"
      className="fixed inset-y-0 right-0 w-96 bg-background border-l border-border shadow-xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">What's New</h2>
        </div>
        <Button
          variant="ghost"
          size="xs"
          onClick={onClose}
          aria-label="Close panel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {changelog.map((entry, index) => (
          <article key={index} className="space-y-2">
            <time className="text-xs text-muted-foreground">
              {formatDate(entry.date)}
            </time>
            <h3 className="text-sm font-medium text-foreground">{entry.title}</h3>
            <p className="text-sm text-muted-foreground">{entry.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

const STORAGE_KEY = 'datahub-whats-new-last-read';

function checkHasUnread(changelog: ChangelogEntry[]): boolean {
  const lastRead = localStorage.getItem(STORAGE_KEY);
  if (!lastRead || !changelog.length) {
    return changelog.length > 0;
  }
  const lastReadDate = new Date(lastRead);
  const latestEntry = new Date(changelog[0].date);
  return latestEntry > lastReadDate;
}

interface WhatsNewButtonProps {
  changelog: ChangelogEntry[];
}

export function WhatsNewButton({ changelog }: WhatsNewButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(() => checkHasUnread(changelog));

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (changelog.length > 0) {
      localStorage.setItem(STORAGE_KEY, changelog[0].date);
      setHasUnread(false);
    }
  }, [changelog]);

  return (
    <>
      <button
        onClick={handleOpen}
        className="relative flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        aria-label="What's New"
      >
        <Sparkles className="h-4 w-4" />
        <span>What's New</span>
        {hasUnread && (
          <span
            data-testid="unread-badge"
            className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary"
          />
        )}
      </button>

      {isOpen && <WhatsNew changelog={changelog} onClose={handleClose} />}
    </>
  );
}
