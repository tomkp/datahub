import { Link } from 'react-router-dom';
import { Database, Folder, FileText, GitBranch } from 'lucide-react';
import { useDataRooms } from '../hooks/useDataRooms';

function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  href: string;
}) {
  return (
    <Link
      to={href}
      className="flex items-center gap-4 p-6 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors duration-150"
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </Link>
  );
}

export function Dashboard() {
  const { data: dataRooms } = useDataRooms();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your data management platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Database}
          label="Data Rooms"
          value={dataRooms?.length ?? '-'}
          href="/data-rooms"
        />
        <StatCard
          icon={Folder}
          label="Folders"
          value="-"
          href="/data-rooms"
        />
        <StatCard
          icon={FileText}
          label="Files"
          value="-"
          href="/data-rooms"
        />
        <StatCard
          icon={GitBranch}
          label="Pipelines"
          value="-"
          href="/pipelines"
        />
      </div>

      <div>
        <h2 className="text-lg font-medium text-foreground mb-4">Recent Activity</h2>
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          <p>No recent activity</p>
        </div>
      </div>
    </div>
  );
}
