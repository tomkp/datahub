import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useQueryState, parseAsBoolean } from 'nuqs';
import { DataRoomList } from '../components/DataRoomList';
import { useCreateDataRoom } from '../hooks/useDataRooms';

export function DataRooms() {
  const [showCreate, setShowCreate] = useQueryState('create', parseAsBoolean.withDefault(false));
  const [name, setName] = useState('');
  const createMutation = useCreateDataRoom();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await createMutation.mutateAsync({
      name: name.trim(),
      tenantId: 'default', // TODO: Get from context
      storageUrl: `/storage/${name.toLowerCase().replace(/\s+/g, '-')}`,
    });

    setName('');
    setShowCreate(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Data Rooms</h1>
          <p className="text-muted-foreground mt-1">
            Manage your data rooms and files
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150 text-sm"
        >
          <Plus className="h-4 w-4" />
          New Data Room
        </button>
      </div>

      {showCreate && (
        <div className="border border-border rounded-lg p-4 bg-card">
          <form onSubmit={handleCreate} className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter data room name"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || !name.trim()}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors duration-150"
              >
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      <DataRoomList />
    </div>
  );
}
