import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GitBranch, ChevronRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useDataRooms } from '../hooks/useDataRooms';
import { usePipelines, usePipelineRuns } from '../hooks/usePipelines';
import { QueryError } from '../components/ui';
import { StatusBadge } from '../components';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import type { Pipeline, PipelineRun, DataRoom } from '../lib/api';

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

function PipelineCard({ pipeline, dataRoom }: { pipeline: Pipeline; dataRoom: DataRoom }) {
  const { data: runs } = usePipelineRuns(pipeline.id);
  const recentRuns = runs?.slice(0, 5) || [];

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-foreground">{pipeline.datasetKind || 'Pipeline'}</h3>
          <Link
            to={`/data-rooms/${dataRoom.id}`}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            {dataRoom.name}
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <GitBranch className="h-4 w-4" />
          {pipeline.steps?.length || 0} steps
        </div>
      </div>

      {/* Pipeline steps */}
      <div className="flex flex-wrap gap-1 mb-4">
        {pipeline.steps?.map((step) => (
          <span
            key={step}
            className="text-xs px-2 py-0.5 rounded bg-surface-2 text-muted-foreground"
          >
            {step.replace(/_/g, ' ')}
          </span>
        ))}
      </div>

      {/* Recent runs */}
      {recentRuns.length > 0 ? (
        <div className="border-t border-border pt-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
            Recent Runs
          </h4>
          <div className="space-y-2">
            {recentRuns.map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <PipelineStatusIcon status={run.status} />
                  <span className="text-muted-foreground truncate max-w-[150px]">
                    {run.fileVersionId?.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={run.status} size="sm" />
                  <span className="text-xs text-muted-foreground">
                    {formatDate(run.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="border-t border-border pt-3">
          <p className="text-sm text-muted-foreground">No runs yet</p>
        </div>
      )}
    </div>
  );
}

function DataRoomPipelines({ dataRoom }: { dataRoom: DataRoom }) {
  const { data: pipelines, isLoading, isError } = usePipelines(dataRoom.id);

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">Loading pipelines...</div>
    );
  }

  if (isError) {
    return null;
  }

  if (!pipelines?.length) {
    return null;
  }

  return (
    <>
      {pipelines.map((pipeline) => (
        <PipelineCard key={pipeline.id} pipeline={pipeline} dataRoom={dataRoom} />
      ))}
    </>
  );
}

export function Pipelines() {
  const { data: dataRooms, isLoading, isError, error, refetch } = useDataRooms();
  const [filter, setFilter] = useState<'all' | 'active' | 'failed'>('all');

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

      {/* Pipeline grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dataRooms?.map((dataRoom) => (
          <DataRoomPipelines key={dataRoom.id} dataRoom={dataRoom} />
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
