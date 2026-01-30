import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi, type Folder } from '../lib/api';

export function useFolders(dataRoomId: string) {
  const api = useApi();

  return useQuery({
    queryKey: ['folders', dataRoomId],
    queryFn: () => api.dataRooms.getFolders(dataRoomId),
    enabled: !!dataRoomId,
  });
}

export function useFolder(id: string) {
  const api = useApi();

  return useQuery({
    queryKey: ['folder', id],
    queryFn: () => api.folders.get(id),
    enabled: !!id,
  });
}

export function useCreateFolder() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dataRoomId, data }: { dataRoomId: string; data: { name: string; parentId?: string } }) =>
      api.folders.create(dataRoomId, data),
    onSuccess: (_, { dataRoomId }) => {
      queryClient.invalidateQueries({ queryKey: ['folders', dataRoomId] });
    },
  });
}

export function useUpdateFolder() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Folder> }) =>
      api.folders.update(id, data),
    onSuccess: (folder) => {
      queryClient.invalidateQueries({ queryKey: ['folders', folder.dataRoomId] });
      queryClient.invalidateQueries({ queryKey: ['folder', folder.id] });
    },
  });
}

export function useDeleteFolder() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.folders.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}
