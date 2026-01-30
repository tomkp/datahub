import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Button } from './Button';

const queryErrorVariants = cva(
  'rounded-lg bg-red-500/10 text-red-600 dark:text-red-400',
  {
    variants: {
      size: {
        compact: 'p-3',
        default: 'p-4',
        full: 'p-6',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

interface QueryErrorProps extends VariantProps<typeof queryErrorVariants> {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function QueryError({
  title = 'Something went wrong',
  message,
  onRetry,
  size,
  className,
}: QueryErrorProps) {
  return (
    <div
      role="alert"
      className={cn(queryErrorVariants({ size }), className)}
    >
      <div className="flex items-start gap-3">
        <svg
          aria-label="Error"
          className="h-5 w-5 flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm mt-1 opacity-90">{message}</p>
          {onRetry && (
            <Button
              variant="danger"
              size="sm"
              onClick={onRetry}
              className="mt-3"
            >
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
