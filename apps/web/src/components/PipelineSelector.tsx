import { GitBranch } from 'lucide-react';
import type { Pipeline } from '../lib/api';

interface PipelineSelectorProps {
  pipelines: Pipeline[];
  selectedPipelineId: string | null;
  onSelect: (pipelineId: string | null) => void;
  disabled?: boolean;
  required?: boolean;
}

export function PipelineSelector({
  pipelines,
  selectedPipelineId,
  onSelect,
  disabled = false,
  required = false,
}: PipelineSelectorProps) {
  const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);

  if (pipelines.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No pipelines configured for this data room.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor="pipeline-selector"
        className="flex items-center gap-2 text-sm font-medium text-foreground"
      >
        <GitBranch className="h-4 w-4" />
        Processing Pipeline {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id="pipeline-selector"
        value={selectedPipelineId || ''}
        onChange={(e) => onSelect(e.target.value || null)}
        disabled={disabled}
        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 disabled:opacity-50"
      >
        <option value="">Select a pipeline...</option>
        {pipelines.map((pipeline) => (
          <option key={pipeline.id} value={pipeline.id}>
            {pipeline.name} ({pipeline.steps.length} steps)
          </option>
        ))}
      </select>

      {selectedPipeline && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedPipeline.steps.map((step) => (
            <span
              key={step}
              className="text-xs px-1.5 py-0.5 rounded bg-surface-2 text-muted-foreground"
            >
              {step.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
