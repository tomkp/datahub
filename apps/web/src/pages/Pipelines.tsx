import { Link } from 'react-router-dom';
import { GitBranch, ChevronRight, AlertCircle, CheckCircle2, Loader2, Filter } from 'lucide-react';
import { useQueryState, parseAsStringLiteral } from 'nuqs';
import { useDataRooms } from '../hooks/useDataRooms';
import { usePipelines, useDataRoomPipelineRuns } from '../hooks/usePipelines';
import { QueryError } from '../components/ui';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { cn } from '../lib/utils';
import type { Pipeline, PipelineRun, DataRoom } from '../lib/api';

const DEFAULT_RUNS_LIMIT = 20;
const RUNS_PER_PIPELINE = 5;
const filterValues = ['all', 'active', 'failed'] as const;
type FilterValue = typeof filterValues[number];

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function PipelineStatusIcon({ status }: { status: PipelineRun['status'] }) {
  switch (status) {
    case 'processed':
      return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
    case 'processing':
      return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
    case 'errored':
      return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
    default:
      return null;
  }
}

interface PipelineCardProps {
  pipeline: Pipeline;
  runs: PipelineRun[];
  dataRoomId: string;
  maxRuns?: number;
}

function PipelineCard({ pipeline, runs, dataRoomId, maxRuns = RUNS_PER_PIPELINE }: PipelineCardProps) {
  const displayName = pipeline.name || pipeline.datasetKind?.replace(/_/g, ' ') || 'Unnamed Pipeline';
  const pipelineRuns = runs.filter(r => r.pipelineId === pipeline.id).slice(0, maxRuns);
  const activeCount = pipelineRuns.filter(r => r.status === 'processing').length;
  const failedCount = pipelineRuns.filter(r => r.status === 'errored').length;

  return (
    <div className="rounded-lg border border-border bg-surface-1 overflow-hidden">
      {/* Pipeline header */}
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground text-sm truncate" title={displayName}>
                {displayName}
              </h3>
              {activeCount > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] text-primary">
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  {activeCount}
                </span>
              )}
              {failedCount > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] text-red-600 dark:text-red-400">
                  <AlertCircle className="h-2.5 w-2.5" />
                  {failedCount}
                </span>
              )}
            </div>
            {pipeline.datasetKind && pipeline.name && (
              <p className="text-xs text-muted-foreground truncate">
                {pipeline.datasetKind.replace(/_/g, ' ')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2 shrink-0">
            <GitBranch className="h-3 w-3" />
            {pipeline.steps?.length || 0}
          </div>
        </div>

        {/* Pipeline steps */}
        <div className="flex flex-wrap gap-1">
          {pipeline.steps?.slice(0, 4).map((step) => (
            <span
              key={step}
              className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 text-muted-foreground capitalize"
            >
              {step.replace(/_/g, ' ')}
            </span>
          ))}
          {(pipeline.steps?.length || 0) > 4 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 text-muted-foreground">
              +{(pipeline.steps?.length || 0) - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Recent runs for this pipeline */}
      {pipelineRuns.length > 0 && (
        <div className="border-t border-border bg-surface-2/30">
          <div className="divide-y divide-border">
            {pipelineRuns.map((run) => {
              const linkTo = run.folderId && run.fileId
                ? `/data-rooms/${dataRoomId}?folder=${run.folderId}&file=${run.fileId}`
                : '#';
              return (
                <Link
                  key={run.id}
                  to={linkTo}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-muted/30 transition-colors duration-150"
                >
                  <PipelineStatusIcon status={run.status} />
                  <span className="text-xs text-foreground truncate flex-1" title={run.fileName}>
                    {run.fileName || run.fileVersionId?.slice(0, 8) + '...'}
                  </span>
                  {run.versionNumber && (run.versionCount ?? 0) > 1 && (
                    <span className="text-[10px] px-1 py-0.5 rounded bg-surface-2 text-muted-foreground shrink-0">
                      v{run.versionNumber}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatRelativeTime(run.createdAt)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state for runs */}
      {pipelineRuns.length === 0 && (
        <div className="border-t border-border bg-surface-2/30 px-3 py-2">
          <p className="text-[10px] text-muted-foreground text-center">No recent runs</p>
        </div>
      )}
    </div>
  );
}

function filterRuns(runs: PipelineRun[], filter: FilterValue): PipelineRun[] {
  if (filter === 'all') return runs;
  if (filter === 'active') return runs.filter(run => run.status === 'processing');
  if (filter === 'failed') return runs.filter(run => run.status === 'errored');
  return runs;
}


interface DataRoomSectionProps {
  dataRoom: DataRoom;
  runsLimit: number;
  filter: FilterValue;
  runsPerPipeline: number;
}

function DataRoomSection({ dataRoom, runsLimit, filter, runsPerPipeline }: DataRoomSectionProps) {
  const { data: pipelines, isLoading: pipelinesLoading } = usePipelines(dataRoom.id);
  const { data: runs, isLoading: runsLoading } = useDataRoomPipelineRuns(dataRoom.id, runsLimit);

  if (pipelinesLoading || runsLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-surface-2 rounded w-1/3" />
          <div className="h-24 bg-surface-2 rounded" />
          <div className="h-24 bg-surface-2 rounded" />
        </div>
      </div>
    );
  }

  if (!pipelines?.length) {
    return null;
  }

  const filteredRuns = filterRuns(runs || [], filter);

  // When filtering, check if any pipeline has matching runs
  const pipelinesWithMatchingRuns = pipelines.filter(p =>
    filteredRuns.some(r => r.pipelineId === p.id)
  );

  // When filtering, hide sections that have no matching runs
  if (filter !== 'all' && pipelinesWithMatchingRuns.length === 0) {
    return null;
  }

  const activeCount = runs?.filter(r => r.status === 'processing').length || 0;
  const failedCount = runs?.filter(r => r.status === 'errored').length || 0;

  // When filtering, only show pipelines with matching runs
  const displayPipelines = filter === 'all' ? pipelines : pipelinesWithMatchingRuns;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Data Room Header */}
      <div className="px-4 py-3 border-b border-border bg-surface-1">
        <div className="flex items-center justify-between">
          <Link
            to={`/data-rooms/${dataRoom.id}`}
            className="font-medium text-foreground hover:text-primary flex items-center gap-1 group"
          >
            {dataRoom.name}
            <ChevronRight className="h-4 w-4 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
          </Link>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-primary">
                <Loader2 className="h-3 w-3 animate-spin" />
                {activeCount}
              </span>
            )}
            {failedCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-3 w-3" />
                {failedCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pipelines with their runs */}
      <div className="p-4">
        <div className="grid grid-cols-1 gap-3">
          {displayPipelines.map((pipeline) => (
            <PipelineCard
              key={pipeline.id}
              pipeline={pipeline}
              runs={filteredRuns}
              dataRoomId={dataRoom.id}
              maxRuns={runsPerPipeline}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface FilterTabsProps {
  value: FilterValue;
  onChange: (value: FilterValue) => void;
  counts: { all: number; active: number; failed: number };
}

function FilterTabs({ value, onChange, counts }: FilterTabsProps) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-surface-1 p-0.5">
      {filterValues.map((filter) => {
        const isActive = value === filter;
        const count = counts[filter];
        const label = filter === 'all' ? 'All' : filter === 'active' ? 'Active' : 'Failed';

        return (
          <button
            key={filter}
            onClick={() => onChange(filter)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
            {count > 0 && (
              <span className={cn(
                'ml-1.5 text-xs',
                isActive ? 'text-muted-foreground' : 'text-muted-foreground/70',
                filter === 'active' && count > 0 && 'text-primary',
                filter === 'failed' && count > 0 && 'text-red-500',
              )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Pipelines() {
  const { data: dataRooms, isLoading, isError, error, refetch } = useDataRooms();
  const [filter, setFilter] = useQueryState('filter', parseAsStringLiteral(filterValues).withDefault('all'));
  const runsLimit = DEFAULT_RUNS_LIMIT;

  useDocumentTitle('Pipelines');

  // Aggregate counts from all data rooms (we'll need to fetch this)
  // For now, use placeholder - the individual sections will show their own counts
  const counts = { all: 0, active: 0, failed: 0 };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading pipelines...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-full flex items-center justify-center">
        <QueryError
          title="Failed to load pipelines"
          message={error?.message || 'An unexpected error occurred'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Pipelines</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor data processing across all data rooms
          </p>
        </div>
        <FilterTabs value={filter} onChange={setFilter} counts={counts} />
      </div>

      {/* Data room sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {dataRooms?.map((dataRoom) => (
          <DataRoomSection
            key={dataRoom.id}
            dataRoom={dataRoom}
            runsLimit={runsLimit}
            filter={filter}
            runsPerPipeline={RUNS_PER_PIPELINE}
          />
        ))}
      </div>

      {/* Empty state when filter shows nothing */}
      {filter !== 'all' && dataRooms?.length && (
        <div className="hidden only:flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Filter className="h-12 w-12 mb-4 opacity-40" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No {filter === 'active' ? 'active' : 'failed'} runs
          </h3>
          <p className="text-sm">
            {filter === 'active'
              ? 'All pipelines have finished processing.'
              : 'No pipelines have failed recently.'}
          </p>
          <button
            onClick={() => setFilter('all')}
            className="mt-4 text-sm text-primary hover:underline"
          >
            View all runs
          </button>
        </div>
      )}

      {/* Empty state - no data rooms */}
      {!dataRooms?.length && (
        <div className="text-center py-12">
          <GitBranch className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No pipelines yet</h3>
          <p className="text-sm text-muted-foreground">
            Pipelines will appear here once you create data rooms with processing workflows.
          </p>
        </div>
      )}
    </div>
  );
}
