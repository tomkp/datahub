import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi, type DataRoom } from '../lib/api';

export function useDataRooms() {
  const api = useApi();

  return useQuery({
    queryKey: ['dataRooms'],
    queryFn: () => api.dataRooms.list(),
  });
}

export function useDataRoom(id: string) {
  const api = useApi();

  return useQuery({
    queryKey: ['dataRooms', id],
    queryFn: () => api.dataRooms.get(id),
    enabled: !!id,
  });
}

export function useCreateDataRoom() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; tenantId: string; storageUrl: string; publicUrl?: string; description?: string }) =>
      api.dataRooms.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataRooms'] });
    },
  });
}

export function useUpdateDataRoom() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DataRoom> }) =>
      api.dataRooms.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['dataRooms'] });
      queryClient.invalidateQueries({ queryKey: ['dataRooms', id] });
    },
  });
}

export function useDeleteDataRoom() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.dataRooms.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataRooms'] });
    },
  });
}
