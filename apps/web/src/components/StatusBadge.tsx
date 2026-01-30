import { Badge } from './ui/Badge';
import { type VariantProps } from 'class-variance-authority';
import { badgeVariants } from './ui/variants';

type Status = 'pending' | 'processing' | 'processed' | 'errored' | 'warned';

const STATUS_LABELS: Record<Status, string> = {
  pending: 'Pending',
  processing: 'Processing',
  processed: 'Processed',
  errored: 'Errored',
  warned: 'Warned',
};

const STATUS_VARIANTS: Record<Status, VariantProps<typeof badgeVariants>['variant']> = {
  pending: 'default',
  processing: 'primary',
  processed: 'success',
  errored: 'error',
  warned: 'warning',
};

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md';
  showIndicator?: boolean;
  className?: string;
}

export function StatusBadge({ status, size = 'sm', showIndicator, className }: StatusBadgeProps) {
  const isProcessing = status === 'processing';

  return (
    <span className="inline-flex items-center gap-1.5">
      {showIndicator && isProcessing && (
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
      )}
      <Badge variant={STATUS_VARIANTS[status]} size={size} className={className}>
        {STATUS_LABELS[status]}
      </Badge>
    </span>
  );
}
