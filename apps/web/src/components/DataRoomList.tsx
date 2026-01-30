import { Link } from 'react-router-dom';
import { Database, ChevronRight } from 'lucide-react';
import { useDataRooms } from '../hooks/useDataRooms';
import { cn } from '../lib/utils';

function LoadingSkeleton() {
  return (
    <div data-testid="loading-skeleton" className="space-y-1">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-9 rounded bg-surface-2 animate-pulse" />
      ))}
    </div>
  );
}

export function DataRoomList() {
  const { data: dataRooms, isLoading, isError, error } = useDataRooms();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError) {
    return (
      <div className="rounded bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
        {error?.message || 'Failed to load data rooms'}
      </div>
    );
  }

  if (!dataRooms?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Database className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm font-medium">No data rooms</p>
        <p className="text-xs">Create your first data room to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {dataRooms.map((room) => (
        <Link
          key={room.id}
          to={`/data-rooms/${room.id}`}
          className={cn(
            'flex items-center justify-between px-3 py-2 rounded',
            'hover:bg-surface-2 transition-colors duration-75 group'
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Database className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <span className="text-sm font-medium text-foreground truncate block">
                {room.name}
              </span>
              {room.description && (
                <span className="text-xs text-muted-foreground truncate block">
                  {room.description}
                </span>
              )}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </Link>
      ))}
    </div>
  );
}
