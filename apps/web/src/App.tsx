export function App() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="w-60 border-r border-border bg-muted/50 p-4">
        <h1 className="text-lg font-semibold text-foreground">DataHub</h1>
      </aside>
      <main className="flex-1 p-6">
        <p className="text-muted-foreground">Welcome to DataHub</p>
      </main>
    </div>
  );
}
