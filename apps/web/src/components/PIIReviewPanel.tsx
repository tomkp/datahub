import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, User } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

type ReviewStatus = 'pending' | 'approved' | 'rejected';

interface PIIReviewPanelProps {
  fileId: string;
  onApprove: (fileId: string, comment: string) => void;
  onReject: (fileId: string, comment: string) => void;
  reviewStatus?: ReviewStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewComment?: string;
  isSubmitting?: boolean;
}

function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PIIReviewPanel({
  fileId,
  onApprove,
  onReject,
  reviewStatus,
  reviewedAt,
  reviewedBy,
  reviewComment,
  isSubmitting = false,
}: PIIReviewPanelProps) {
  const [comment, setComment] = useState('');

  const isReviewed = reviewStatus === 'approved' || reviewStatus === 'rejected';

  const handleApprove = () => {
    onApprove(fileId, comment);
  };

  const handleReject = () => {
    onReject(fileId, comment);
  };

  if (isReviewed) {
    return (
      <div
        className={cn(
          'rounded-lg p-4',
          reviewStatus === 'approved'
            ? 'bg-green-50 dark:bg-green-900/20'
            : 'bg-red-50 dark:bg-red-900/20'
        )}
      >
        <div className="flex items-center gap-2 mb-3">
          {reviewStatus === 'approved' ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="font-medium text-green-800 dark:text-green-200">
                Approved
              </span>
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span className="font-medium text-red-800 dark:text-red-200">
                Rejected
              </span>
            </>
          )}
        </div>

        <div className="space-y-2 text-sm">
          {reviewedBy && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{reviewedBy}</span>
            </div>
          )}
          {reviewedAt && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatDateTime(reviewedAt)}</span>
            </div>
          )}
          {reviewComment && (
            <p className="mt-2 pt-2 border-t border-border text-foreground">
              {reviewComment}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="review-comment" className="sr-only">
          Review comment
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment explaining your decision (optional)"
          aria-label="Review comment"
          className={cn(
            'w-full min-h-[80px] px-3 py-2 rounded-lg',
            'bg-surface border border-border',
            'text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary/50',
            'resize-y'
          )}
        />
      </div>

      <div className="flex gap-3">
        <Button
          variant="success"
          onClick={handleApprove}
          disabled={isSubmitting}
          className="flex items-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          Approve
        </Button>
        <Button
          variant="danger"
          onClick={handleReject}
          disabled={isSubmitting}
          className="flex items-center gap-2"
        >
          <XCircle className="h-4 w-4" />
          Reject
        </Button>
      </div>
    </div>
  );
}
