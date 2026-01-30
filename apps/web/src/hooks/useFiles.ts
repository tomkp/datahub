import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../lib/api';

export function useFiles(folderId: string) {
  const api = useApi();

  return useQuery({
    queryKey: ['files', folderId],
    queryFn: () => api.folders.getFiles(folderId),
    enabled: !!folderId,
  });
}

export function useFile(id: string) {
  const api = useApi();

  return useQuery({
    queryKey: ['file', id],
    queryFn: () => api.files.get(id),
    enabled: !!id,
  });
}

export function useFileVersions(fileId: string) {
  const api = useApi();

  return useQuery({
    queryKey: ['fileVersions', fileId],
    queryFn: () => api.files.getVersions(fileId),
    enabled: !!fileId,
  });
}

export function useUploadFile() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ folderId, file }: { folderId: string; file: File }) =>
      api.files.upload(folderId, file),
    onSuccess: (_, { folderId }) => {
      queryClient.invalidateQueries({ queryKey: ['files', folderId] });
    },
  });
}

export function useUploadFileVersion() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fileId, file }: { fileId: string; file: File }) =>
      api.files.uploadVersion(fileId, file),
    onSuccess: (_, { fileId }) => {
      queryClient.invalidateQueries({ queryKey: ['file', fileId] });
      queryClient.invalidateQueries({ queryKey: ['fileVersions', fileId] });
    },
  });
}

export function useDeleteFile() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.files.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
}
