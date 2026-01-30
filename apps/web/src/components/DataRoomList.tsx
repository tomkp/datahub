import { Link } from 'react-router-dom';
import { Database, ChevronRight } from 'lucide-react';
import { useDataRooms } from '../hooks/useDataRooms';
import { cn } from '../lib/utils';

function LoadingSkeleton() {
  return (
    <div data-testid="loading-skeleton" className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-16 rounded-lg bg-muted/50 animate-pulse"
        />
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
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        {error?.message || 'Failed to load data rooms'}
      </div>
    );
  }

  if (!dataRooms?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Database className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No data rooms</p>
        <p className="text-sm">Create your first data room to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {dataRooms.map((room) => (
        <Link
          key={room.id}
          to={`/data-rooms/${room.id}`}
          className={cn(
            'flex items-center justify-between p-4 rounded-lg',
            'border border-border bg-card hover:bg-muted/50',
            'transition-colors duration-150'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">{room.name}</h3>
              {room.description && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {room.description}
                </p>
              )}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>
      ))}
    </div>
  );
}
