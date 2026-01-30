import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertCircle, CheckCircle2, FileWarning, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

interface PIISample {
  value: string;
  location: string;
}

interface PIIType {
  type: string;
  confidence: number;
  count: number;
  samples: PIISample[];
}

interface CompletedResult {
  status: 'completed';
  piiTypes: PIIType[];
}

interface UnsupportedResult {
  status: 'unsupported';
  reason: string;
}

interface PendingResult {
  status: 'pending';
}

type PIIScanResult = CompletedResult | UnsupportedResult | PendingResult;

interface PIIScanResultsProps {
  results: PIIScanResult;
}

function PIITypeAccordion({ piiType }: { piiType: PIIType }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className={cn(
          'w-full flex items-center justify-between p-3',
          'hover:bg-surface-2 transition-colors text-left'
        )}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-medium text-foreground">{piiType.type}</span>
          <span className="text-sm text-muted-foreground">
            {piiType.count} occurrences
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-sm font-medium px-2 py-0.5 rounded',
              piiType.confidence >= 0.9
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : piiType.confidence >= 0.7
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            )}
          >
            {Math.round(piiType.confidence * 100)}%
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border bg-surface-2 p-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
            Sample Occurrences ({piiType.samples.length} shown)
          </h4>
          <ul role="list" className="space-y-2">
            {piiType.samples.map((sample, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-sm"
              >
                <code className="flex-1 px-2 py-1 bg-surface rounded text-foreground font-mono text-xs">
                  {sample.value}
                </code>
                <span className="text-muted-foreground text-xs whitespace-nowrap">
                  {sample.location}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function PIIScanResults({ results }: PIIScanResultsProps) {
  if (results.status === 'pending') {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-surface-2 text-muted-foreground">
        <Clock className="h-5 w-5" />
        <span>PII scan pending</span>
      </div>
    );
  }

  if (results.status === 'unsupported') {
    return (
      <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200">
        <FileWarning className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">PII scanning not supported</p>
          <p className="text-sm mt-1 opacity-80">{results.reason}</p>
        </div>
      </div>
    );
  }

  if (results.piiTypes.length === 0) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200">
        <CheckCircle2 className="h-5 w-5" />
        <span>No PII detected</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
        <AlertCircle className="h-5 w-5" />
        <span className="font-medium">
          {results.piiTypes.length} PII type{results.piiTypes.length > 1 ? 's' : ''} detected
        </span>
      </div>

      <div className="space-y-2">
        {results.piiTypes.map((piiType) => (
          <PIITypeAccordion key={piiType.type} piiType={piiType} />
        ))}
      </div>
    </div>
  );
}
