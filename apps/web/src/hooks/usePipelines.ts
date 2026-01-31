import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi, type Pipeline } from '../lib/api';

export function usePipelines(dataRoomId: string) {
  const api = useApi();

  return useQuery({
    queryKey: ['pipelines', dataRoomId],
    queryFn: () => api.pipelines.list(dataRoomId),
    enabled: !!dataRoomId,
  });
}

export function usePipeline(id: string) {
  const api = useApi();

  return useQuery({
    queryKey: ['pipeline', id],
    queryFn: () => api.pipelines.get(id),
    enabled: !!id,
  });
}

export function useCreatePipeline() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dataRoomId, data }: { dataRoomId: string; data: { name: string; steps: string[]; datasetKind?: string } }) =>
      api.pipelines.create(dataRoomId, data),
    onSuccess: (_, { dataRoomId }) => {
      queryClient.invalidateQueries({ queryKey: ['pipelines', dataRoomId] });
    },
  });
}

export function useUpdatePipeline() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pipeline> }) =>
      api.pipelines.update(id, data),
    onSuccess: (pipeline) => {
      queryClient.invalidateQueries({ queryKey: ['pipelines', pipeline.dataRoomId] });
      queryClient.invalidateQueries({ queryKey: ['pipeline', pipeline.id] });
    },
  });
}

export function useDeletePipeline() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.pipelines.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
    },
  });
}

export function usePipelineRuns(pipelineId: string) {
  const api = useApi();

  return useQuery({
    queryKey: ['pipelineRuns', pipelineId],
    queryFn: () => api.pipelines.getRuns(pipelineId),
    enabled: !!pipelineId,
  });
}

export function usePipelineRun(id: string) {
  const api = useApi();

  return useQuery({
    queryKey: ['pipelineRun', id],
    queryFn: () => api.pipelineRuns.get(id),
    enabled: !!id,
  });
}

export function useCreatePipelineRun() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { pipelineId: string; fileVersionId: string }) =>
      api.pipelineRuns.create(data),
    onSuccess: (_, { pipelineId }) => {
      queryClient.invalidateQueries({ queryKey: ['pipelineRuns', pipelineId] });
    },
  });
}

export function useRetryPipelineRun() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.pipelineRuns.retry(id),
    onSuccess: (run) => {
      queryClient.invalidateQueries({ queryKey: ['pipelineRun', run.id] });
      queryClient.invalidateQueries({ queryKey: ['pipelineRuns', run.pipelineId] });
    },
  });
}

export function usePipelineRunByFileVersion(fileVersionId: string | undefined) {
  const api = useApi();

  return useQuery({
    queryKey: ['pipelineRun', 'fileVersion', fileVersionId],
    queryFn: () => api.pipelineRuns.getByFileVersion(fileVersionId!),
    enabled: !!fileVersionId,
  });
}

export function useDataRoomPipelineRuns(dataRoomId: string, limit = 10) {
  const api = useApi();

  return useQuery({
    queryKey: ['dataRoomPipelineRuns', dataRoomId, limit],
    queryFn: () => api.dataRooms.getPipelineRuns(dataRoomId, limit),
    enabled: !!dataRoomId,
  });
}
