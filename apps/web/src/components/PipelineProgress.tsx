import { useState } from 'react';
import { ChevronDown, ChevronRight, Clock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
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

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
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
  switch (status) {
    case 'processed':
      return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
    case 'processing':
      return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
    case 'errored':
      return <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
    case 'warned':
      return <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
    default:
      return <div className="h-5 w-5 rounded-full border-2 border-border" />;
  }
}

function PipelineStepItem({ step, isLast }: { step: PipelineStep; isLast: boolean }) {
  const [isExpanded, setIsExpanded] = useState(step.status === 'errored');
  const hasDetails = step.errorMessage || step.messages;

  return (
    <li
      data-status={step.status}
      className="relative flex gap-4"
    >
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-[10px] top-7 bottom-0 w-0.5 bg-border" />
      )}

      {/* Step icon */}
      <div className="relative z-10 flex-shrink-0">
        <StepIcon status={step.status} />
      </div>

      {/* Step content */}
      <div className="flex-1 pb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-foreground">
            {formatStepName(step.step)}
          </h3>
          <StatusBadge status={step.status} size="sm" />
        </div>

        {/* Timestamps */}
        <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
          {step.startedAt && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Started {formatTimestamp(step.startedAt)}
            </span>
          )}
          {step.startedAt && step.completedAt && (
            <span className="text-foreground font-medium">
              {formatDuration(step.startedAt, step.completedAt)}
            </span>
          )}
        </div>

        {/* Error message preview */}
        {step.errorMessage && !isExpanded && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400 truncate">
            {step.errorMessage}
          </p>
        )}

        {/* Expand/collapse button */}
        {hasDetails && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'mt-2 flex items-center gap-1 text-xs text-muted-foreground',
              'hover:text-foreground transition-colors'
            )}
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            {isExpanded ? 'Hide details' : 'Show details'}
          </button>
        )}

        {/* Expanded details */}
        {isExpanded && hasDetails && (
          <div className="mt-2 p-3 rounded-lg bg-surface-2 text-sm">
            {step.errorMessage && (
              <p className="text-red-600 dark:text-red-400">{step.errorMessage}</p>
            )}
            {step.messages && (
              <pre className="mt-2 text-xs text-muted-foreground overflow-x-auto">
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
    <ul role="list" className="space-y-0">
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
