import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertCircle, Check, Loader2, Circle } from 'lucide-react';
import { cn } from '../lib/utils';

type StepStatus = 'pending' | 'processing' | 'processed' | 'errored' | 'warned';

interface PipelineStep {
  step: string;
  status: StepStatus;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  messages?: Record<string, unknown>;
}

interface PipelineProgressProps {
  steps: PipelineStep[];
}

const STEP_LABELS: Record<string, string> = {
  malware_scan: 'Malware Scan',
  pii_scan: 'PII Scan',
  pii_review: 'PII Review',
  versioning: 'Versioning',
  data_validation: 'Data Validation',
  ingestion: 'Ingestion',
  control_checks: 'Control Checks',
};

function formatStepName(step: string): string {
  return STEP_LABELS[step] || step.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDuration(startedAt: string, completedAt: string): string {
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  const diffMs = end - start;

  if (diffMs < 1000) return `${diffMs}ms`;
  if (diffMs < 60000) return `${Math.round(diffMs / 1000)}s`;
  return `${Math.round(diffMs / 60000)}m`;
}

function StepIcon({ status }: { status: StepStatus }) {
  const baseClasses = "h-4 w-4 flex items-center justify-center rounded-full";

  switch (status) {
    case 'processed':
      return (
        <div className={cn(baseClasses, "bg-green-500 dark:bg-green-600")}>
          <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
        </div>
      );
    case 'processing':
      return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
    case 'errored':
      return (
        <div className={cn(baseClasses, "bg-red-500 dark:bg-red-600")}>
          <AlertCircle className="h-2.5 w-2.5 text-white" />
        </div>
      );
    case 'warned':
      return (
        <div className={cn(baseClasses, "bg-yellow-500 dark:bg-yellow-600")}>
          <AlertCircle className="h-2.5 w-2.5 text-white" />
        </div>
      );
    default:
      return <Circle className="h-4 w-4 text-muted-foreground/40" />;
  }
}

function PipelineStepItem({ step, isLast }: { step: PipelineStep; isLast: boolean }) {
  const [isExpanded, setIsExpanded] = useState(step.status === 'errored');
  const hasDetails = step.errorMessage || step.messages;

  return (
    <li
      data-status={step.status}
      className="relative flex items-start gap-3"
    >
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-[7px] top-5 bottom-0 w-px bg-border" />
      )}

      {/* Step icon */}
      <div className="relative z-10 flex-shrink-0 mt-0.5">
        <StepIcon status={step.status} />
      </div>

      {/* Step content */}
      <div className={cn("flex-1 min-w-0", !isLast && "pb-3")}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] text-foreground truncate">
            {formatStepName(step.step)}
          </span>
          {step.startedAt && step.completedAt && (
            <span className="text-xs text-muted-foreground tabular-nums shrink-0">
              {formatDuration(step.startedAt, step.completedAt)}
            </span>
          )}
          {step.status === 'processing' && (
            <span className="text-xs text-primary shrink-0">Running...</span>
          )}
        </div>

        {/* Error message preview */}
        {step.errorMessage && !isExpanded && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400 truncate">
            {step.errorMessage}
          </p>
        )}

        {/* Expand/collapse button */}
        {hasDetails && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'mt-1 flex items-center gap-0.5 text-xs text-muted-foreground',
              'hover:text-foreground transition-colors'
            )}
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            Details
          </button>
        )}

        {/* Expanded details */}
        {isExpanded && hasDetails && (
          <div className="mt-2 p-2 rounded bg-surface-2 text-xs">
            {step.errorMessage && (
              <p className="text-red-600 dark:text-red-400">{step.errorMessage}</p>
            )}
            {step.messages && (
              <pre className="mt-1 text-[11px] text-muted-foreground overflow-x-auto">
                {JSON.stringify(step.messages, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export function PipelineProgress({ steps }: PipelineProgressProps) {
  return (
    <ul role="list">
      {steps.map((step, index) => (
        <PipelineStepItem
          key={step.step}
          step={step}
          isLast={index === steps.length - 1}
        />
      ))}
    </ul>
  );
}
