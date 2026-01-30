import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Database, LayoutDashboard, GitBranch, Settings } from 'lucide-react';
import { ApiContext, createApiClient } from './lib/api';
import { Dashboard, DataRooms, DataRoomDetail, FileDetail } from './pages';
import { cn } from './lib/utils';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

// Create API client - in production this would come from auth context
const apiClient = createApiClient(
  import.meta.env.VITE_API_URL || 'http://localhost:3001',
  import.meta.env.VITE_API_TOKEN || 'dev-token'
);

function NavItem({
  to,
  icon: Icon,
  children,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
        )
      }
    >
      <Icon className="h-4 w-4" />
      {children}
    </NavLink>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-60 border-r border-border bg-muted/30 flex flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            DataHub
          </h1>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavItem to="/" icon={LayoutDashboard}>
            Dashboard
          </NavItem>
          <NavItem to="/data-rooms" icon={Database}>
            Data Rooms
          </NavItem>
          <NavItem to="/pipelines" icon={GitBranch}>
            Pipelines
          </NavItem>
        </nav>
        <div className="p-3 border-t border-border">
          <NavItem to="/settings" icon={Settings}>
            Settings
          </NavItem>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ApiContext.Provider value={apiClient}>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/data-rooms" element={<DataRooms />} />
              <Route path="/data-rooms/:id" element={<DataRoomDetail />} />
              <Route path="/files/:id" element={<FileDetail />} />
              <Route path="/pipelines" element={<Pipelines />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </ApiContext.Provider>
    </QueryClientProvider>
  );
}

// Placeholder pages
function Pipelines() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Pipelines</h1>
      <p className="text-muted-foreground">Pipeline management coming soon...</p>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
      <p className="text-muted-foreground">Settings coming soon...</p>
    </div>
  );
}
