import { Link } from 'react-router-dom';
import { Database, GitBranch } from 'lucide-react';
import { useDataRooms } from '../hooks/useDataRooms';
import { PageHeader } from '../components';

export function Dashboard() {
  const { data: dataRooms } = useDataRooms();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your data management platform"
      />

      {/* Stats as inline row instead of cards */}
      <div className="flex items-center gap-6 py-3 border-b border-border">
        <Link to="/data-rooms" className="flex items-center gap-2 group">
          <Database className="h-4 w-4 text-muted-foreground" />
          <span className="text-2xl font-semibold text-foreground">
            {dataRooms?.length ?? '-'}
          </span>
          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            Data Rooms
          </span>
        </Link>
        <div className="h-4 w-px bg-border" />
        <Link to="/pipelines" className="flex items-center gap-2 group">
          <GitBranch className="h-4 w-4 text-muted-foreground" />
          <span className="text-2xl font-semibold text-foreground">-</span>
          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            Pipelines
          </span>
        </Link>
      </div>

      {/* Recent activity as simple list */}
      <div>
        <h2 className="text-sm font-medium text-foreground mb-2">
          Recent Activity
        </h2>
        <div className="text-sm text-muted-foreground py-6 text-center border border-border rounded bg-surface-1">
          No recent activity
        </div>
      </div>
    </div>
  );
}
