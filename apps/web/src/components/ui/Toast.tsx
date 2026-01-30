import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const toastVariants = cva(
  'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-slide-up',
  {
    variants: {
      type: {
        success:
          'bg-success bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400',
        error:
          'bg-error bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400',
        info: 'bg-info bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
      },
    },
    defaultVariants: {
      type: 'info',
    },
  }
);

export interface ToastProps extends VariantProps<typeof toastVariants> {
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
  const Icon = icons[type ?? 'info'];

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
}

const ToastContext = createContext<ToastContextValue | null>(null);

interface ToastProviderProps {
  children: ReactNode;
  autoHideDuration?: number;
}

export function ToastProvider({
  children,
  autoHideDuration = 5000,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastData, 'id'>) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { ...toast, id }]);

      if (autoHideDuration > 0) {
        window.setTimeout(() => {
          removeToast(id);
        }, autoHideDuration);
      }
    },
    [autoHideDuration, removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
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
