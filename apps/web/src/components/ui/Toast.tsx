import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import { cva } from 'class-variance-authority';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const toastVariants = cva(
  'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-slide-up',
  {
    variants: {
      type: {
        success:
          'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400',
        error:
          'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400',
        info: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
      },
    },
    defaultVariants: {
      type: 'info',
    },
  }
);

export interface ToastProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  onDismiss: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

export function Toast({ id, message, type, onDismiss }: ToastProps) {
  const Icon = icons[type];

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={toastVariants({ type })}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button
        onClick={() => onDismiss(id)}
        className="flex-shrink-0 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

interface ToastData {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContextValue {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

interface ToastProviderProps {
  children: ReactNode;
  autoHideDuration?: number;
  maxToasts?: number;
}

const MAX_TOASTS_DEFAULT = 5;

export function ToastProvider({
  children,
  autoHideDuration = 5000,
  maxToasts = MAX_TOASTS_DEFAULT,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const timeoutsRef = useRef<Map<string, number>>(new Map());

  const removeToast = useCallback((id: string) => {
    const timeoutId = timeoutsRef.current.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutsRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastData, 'id'>) => {
      const id = crypto.randomUUID();
      setToasts((prev) => {
        const newToasts = [...prev, { ...toast, id }];
        return newToasts.slice(-maxToasts);
      });

      if (autoHideDuration > 0) {
        const timeoutId = window.setTimeout(() => {
          removeToast(id);
        }, autoHideDuration);
        timeoutsRef.current.set(id, timeoutId);
      }
    },
    [autoHideDuration, removeToast, maxToasts]
  );

  const success = useCallback(
    (message: string) => addToast({ type: 'success', message }),
    [addToast]
  );

  const error = useCallback(
    (message: string) => addToast({ type: 'error', message }),
    [addToast]
  );

  const info = useCallback(
    (message: string) => addToast({ type: 'info', message }),
    [addToast]
  );

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((id) => window.clearTimeout(id));
      timeouts.clear();
    };
  }, []);

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, info }}
    >
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            message={toast.message}
            onDismiss={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
