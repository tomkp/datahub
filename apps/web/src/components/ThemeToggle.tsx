import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '../lib/utils';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded text-[13px] w-full',
        'text-muted-foreground hover:bg-surface-2 hover:text-foreground',
        'transition-colors duration-75'
      )}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="h-4 w-4 shrink-0" />
      ) : (
        <Moon className="h-4 w-4 shrink-0" />
      )}
      <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
    </button>
  );
}
