import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Database, LayoutDashboard, GitBranch, Settings } from 'lucide-react';
import { ApiContext, createApiClient } from './lib/api';
import { Dashboard, DataRooms, DataRoomDetail, FileDetail, Pipelines } from './pages';
import { cn } from './lib/utils';
import { ThemeToggle } from './components/ThemeToggle';
import { ToastProvider } from './components/ui/Toast';

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
          'flex items-center gap-2 px-2 py-1.5 rounded text-[13px] font-medium transition-colors duration-75',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{children}</span>
    </NavLink>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar - Compact, Linear-style */}
      <aside className="w-52 border-r border-border bg-surface-1 flex flex-col">
        {/* Logo area - minimal padding */}
        <div className="px-3 py-2.5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
              <Database className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              DataHub
            </span>
          </div>
        </div>

        {/* Navigation - Tighter spacing */}
        <nav aria-label="Main navigation" className="flex-1 p-2 space-y-0.5">
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

        {/* Footer section */}
        <div className="p-2 border-t border-border space-y-0.5">
          <NavItem to="/settings" icon={Settings}>
            Settings
          </NavItem>
          <ThemeToggle />
        </div>
      </aside>

      {/* Main content - Reduced padding */}
      <main className="flex-1 overflow-hidden bg-background">
        <div className="h-full overflow-y-auto p-4">{children}</div>
      </main>
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ApiContext.Provider value={apiClient}>
        <ToastProvider>
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
        </ToastProvider>
      </ApiContext.Provider>
    </QueryClientProvider>
  );
}

// Placeholder pages
function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-foreground">Settings</h1>
      <p className="text-sm text-muted-foreground">Settings coming soon...</p>
    </div>
  );
}
