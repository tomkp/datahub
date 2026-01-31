import { Link } from 'react-router-dom';
import { GitBranch, ChevronRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useQueryState, parseAsStringLiteral } from 'nuqs';
import { useDataRooms } from '../hooks/useDataRooms';
import { usePipelines, useDataRoomPipelineRuns } from '../hooks/usePipelines';
import { QueryError } from '../components/ui';
import { StatusBadge } from '../components';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import type { Pipeline, PipelineRun, DataRoom } from '../lib/api';

const DEFAULT_RUNS_LIMIT = 10;
const filterValues = ['all', 'active', 'failed'] as const;

function formatDate(dateString?: string) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

function PipelineCard({ pipeline }: { pipeline: Pipeline }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-foreground text-sm">{pipeline.datasetKind || 'Pipeline'}</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <GitBranch className="h-3 w-3" />
          {pipeline.steps?.length || 0} steps
        </div>
      </div>

      {/* Pipeline steps */}
      <div className="flex flex-wrap gap-1">
        {pipeline.steps?.map((step) => (
          <span
            key={step}
            className="text-xs px-1.5 py-0.5 rounded bg-surface-2 text-muted-foreground"
          >
            {step.replace(/_/g, ' ')}
          </span>
        ))}
      </div>
    </div>
  );
}

function RecentRunsList({ runs, dataRoomId }: { runs: PipelineRun[]; dataRoomId: string }) {
  if (runs.length === 0) {
    return <p className="text-sm text-muted-foreground">No runs yet</p>;
  }

  return (
    <div className="space-y-1">
      {runs.map((run) => {
        const linkTo = run.folderId && run.fileId
          ? `/data-rooms/${dataRoomId}?folder=${run.folderId}&file=${run.fileId}`
          : '#';
        return (
          <Link
            key={run.id}
            to={linkTo}
            className="flex items-center justify-between text-sm hover:bg-muted/50 rounded px-2 py-1.5 -mx-2 transition-colors duration-150"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <PipelineStatusIcon status={run.status} />
              <span
                className="text-muted-foreground truncate"
                title={run.folderName && run.fileName ? `${run.folderName} / ${run.fileName}` : run.fileName || run.fileVersionId}
              >
                {run.folderName && run.fileName
                  ? `${run.folderName} / ${run.fileName}`
                  : run.fileName || run.fileVersionId?.slice(0, 8) + '...'}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={run.status} size="sm" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(run.createdAt)}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function DataRoomSection({ dataRoom, runsLimit }: { dataRoom: DataRoom; runsLimit: number }) {
  const { data: pipelines, isLoading: pipelinesLoading } = usePipelines(dataRoom.id);
  const { data: runs, isLoading: runsLoading } = useDataRoomPipelineRuns(dataRoom.id, runsLimit);

  if (pipelinesLoading) {
    return (
      <div className="text-sm text-muted-foreground">Loading pipelines...</div>
    );
  }

  if (!pipelines?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Data Room Header */}
      <div className="px-4 py-3 border-b border-border bg-surface">
        <Link
          to={`/data-rooms/${dataRoom.id}`}
          className="font-medium text-foreground hover:text-primary flex items-center gap-1"
        >
          {dataRoom.name}
          <ChevronRight className="h-4 w-4" />
        </Link>
        {dataRoom.description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{dataRoom.description}</p>
        )}
      </div>

      {/* Pipelines */}
      <div className="p-4 border-b border-border">
        <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
          Pipelines ({pipelines.length})
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {pipelines.map((pipeline) => (
            <PipelineCard key={pipeline.id} pipeline={pipeline} />
          ))}
        </div>
      </div>

      {/* Recent Runs */}
      <div className="p-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
          Recent Runs
        </h4>
        {runsLoading ? (
          <div className="text-sm text-muted-foreground">Loading runs...</div>
        ) : (
          <RecentRunsList runs={runs || []} dataRoomId={dataRoom.id} />
        )}
      </div>
    </div>
  );
}

export function Pipelines() {
  const { data: dataRooms, isLoading, isError, error, refetch } = useDataRooms();
  const [filter, setFilter] = useQueryState('filter', parseAsStringLiteral(filterValues).withDefault('all'));
  const runsLimit = DEFAULT_RUNS_LIMIT;

  useDocumentTitle('Pipelines');

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Pipelines</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and monitor data processing pipelines across all data rooms
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="text-sm px-3 py-1.5 rounded-lg border border-border bg-surface text-foreground"
          >
            <option value="all">All Pipelines</option>
            <option value="active">Active</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Data room sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {dataRooms?.map((dataRoom) => (
          <DataRoomSection key={dataRoom.id} dataRoom={dataRoom} runsLimit={runsLimit} />
        ))}
      </div>

      {/* Empty state */}
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
