import { createContext, useContext } from 'react';
import type {
  PipelineRunStatus,
  PipelineRunStepStatus,
  DatasetKind,
  PipelineStep,
} from '@datahub/shared';

// Re-export shared types for convenience
export type { PipelineRunStatus, PipelineRunStepStatus, DatasetKind, PipelineStep };

// API response types - these have optional timestamps and may include
// additional computed/joined fields not in the base schema

export interface Tenant {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DataRoom {
  id: string;
  tenantId: string;
  name: string;
  storageUrl: string;
  publicUrl?: string;
  description?: string;
  featureFlags?: Record<string, boolean>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Folder {
  id: string;
  dataRoomId: string;
  parentId?: string | null;
  name: string;
  path: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FileVersion {
  id: string;
  fileId: string;
  pipelineId?: string | null;
  storageUrl: string;
  uploadedBy: string;
  uploadedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface File {
  id: string;
  dataRoomId: string;
  folderId: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  versions?: FileVersion[];
  latestVersion?: FileVersion;
  versionCount?: number;
  pipelineStatus?: PipelineRunStatus;
  pipelineName?: string;
}

export interface Pipeline {
  id: string;
  dataRoomId: string;
  name: string;
  steps: PipelineStep[];
  datasetKind?: DatasetKind;
  createdAt?: string;
  updatedAt?: string;
}

// Extended status type that includes 'pending' used by the frontend
export type ExtendedPipelineRunStepStatus = PipelineRunStepStatus | 'pending';

export interface PipelineRunStep {
  id: string;
  pipelineRunId: string;
  step: string;
  status: ExtendedPipelineRunStepStatus;
  errorMessage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PipelineRun {
  id: string;
  pipelineId: string;
  fileVersionId: string;
  status: PipelineRunStatus;
  steps?: PipelineStep[];
  runSteps?: PipelineRunStep[];
  fileId?: string;
  fileName?: string;
  folderId?: string;
  folderName?: string;
  pipelineName?: string;
  versionNumber?: number;
  versionCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiClient {
  baseUrl: string;
  token: string;
  tenants: {
    list: () => Promise<Tenant[]>;
    get: (id: string) => Promise<Tenant>;
    create: (data: { name: string }) => Promise<Tenant>;
    update: (id: string, data: Partial<Tenant>) => Promise<Tenant>;
    delete: (id: string) => Promise<void>;
  };
  dataRooms: {
    list: () => Promise<DataRoom[]>;
    get: (id: string) => Promise<DataRoom>;
    create: (data: { name: string; tenantId: string; storageUrl: string; publicUrl?: string; description?: string }) => Promise<DataRoom>;
    update: (id: string, data: Partial<DataRoom>) => Promise<DataRoom>;
    delete: (id: string) => Promise<void>;
    getFolders: (roomId: string) => Promise<Folder[]>;
    getPipelineRuns: (roomId: string, limit?: number) => Promise<PipelineRun[]>;
  };
  folders: {
    get: (id: string) => Promise<Folder>;
    create: (dataRoomId: string, data: { name: string; parentId?: string }) => Promise<Folder>;
    update: (id: string, data: Partial<Folder>) => Promise<Folder>;
    delete: (id: string) => Promise<void>;
    getFiles: (folderId: string) => Promise<File[]>;
  };
  files: {
    get: (id: string) => Promise<File>;
    upload: (folderId: string, file: globalThis.File, pipelineId?: string) => Promise<File>;
    uploadVersion: (fileId: string, file: globalThis.File, pipelineId?: string) => Promise<FileVersion>;
    delete: (id: string) => Promise<void>;
    getVersions: (fileId: string) => Promise<FileVersion[]>;
  };
  pipelines: {
    list: (dataRoomId: string) => Promise<Pipeline[]>;
    get: (id: string) => Promise<Pipeline>;
    create: (dataRoomId: string, data: { name: string; steps: string[]; datasetKind?: string }) => Promise<Pipeline>;
    update: (id: string, data: Partial<Pipeline>) => Promise<Pipeline>;
    delete: (id: string) => Promise<void>;
    getRuns: (pipelineId: string) => Promise<PipelineRun[]>;
  };
  pipelineRuns: {
    get: (id: string) => Promise<PipelineRun>;
    getByFileVersion: (fileVersionId: string) => Promise<PipelineRun | null>;
    create: (data: { pipelineId: string; fileVersionId: string }) => Promise<PipelineRun>;
    retry: (id: string) => Promise<PipelineRun>;
  };
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export function createApiClient(baseUrl: string, token: string): ApiClient {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const get = <T>(path: string) => fetchJson<T>(`${baseUrl}${path}`, { headers });

  const post = <T>(path: string, body: unknown) =>
    fetchJson<T>(`${baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

  const patch = <T>(path: string, body: unknown) =>
    fetchJson<T>(`${baseUrl}${path}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });

  const del = <T>(path: string) =>
    fetchJson<T>(`${baseUrl}${path}`, {
      method: 'DELETE',
      headers,
    });

  const uploadFile = <T>(path: string, file: globalThis.File, pipelineId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (pipelineId) {
      formData.append('pipelineId', pipelineId);
    }

    return fetchJson<T>(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  };

  return {
    baseUrl,
    token,
    tenants: {
      list: () => get<Tenant[]>('/api/tenants'),
      get: (id) => get<Tenant>(`/api/tenants/${id}`),
      create: (data) => post<Tenant>('/api/tenants', data),
      update: (id, data) => patch<Tenant>(`/api/tenants/${id}`, data),
      delete: (id) => del(`/api/tenants/${id}`),
    },
    dataRooms: {
      list: () => get<DataRoom[]>('/api/data-rooms'),
      get: (id) => get<DataRoom>(`/api/data-rooms/${id}`),
      create: (data) => post<DataRoom>('/api/data-rooms', data),
      update: (id, data) => patch<DataRoom>(`/api/data-rooms/${id}`, data),
      delete: (id) => del(`/api/data-rooms/${id}`),
      getFolders: (roomId) => get<Folder[]>(`/api/data-rooms/${roomId}/folders`),
      getPipelineRuns: (roomId, limit = 10) => get<PipelineRun[]>(`/api/data-rooms/${roomId}/pipeline-runs?limit=${limit}`),
    },
    folders: {
      get: (id) => get<Folder>(`/api/folders/${id}`),
      create: (dataRoomId, data) => post<Folder>(`/api/data-rooms/${dataRoomId}/folders`, data),
      update: (id, data) => patch<Folder>(`/api/folders/${id}`, data),
      delete: (id) => del(`/api/folders/${id}`),
      getFiles: (folderId) => get<File[]>(`/api/folders/${folderId}/files`),
    },
    files: {
      get: (id) => get<File>(`/api/files/${id}`),
      upload: (folderId, file, pipelineId) => uploadFile<File>(`/api/folders/${folderId}/files`, file, pipelineId),
      uploadVersion: (fileId, file, pipelineId) => uploadFile<FileVersion>(`/api/files/${fileId}/versions`, file, pipelineId),
      delete: (id) => del(`/api/files/${id}`),
      getVersions: (fileId) => get<FileVersion[]>(`/api/files/${fileId}/versions`),
    },
    pipelines: {
      list: (dataRoomId) => get<Pipeline[]>(`/api/data-rooms/${dataRoomId}/pipelines`),
      get: (id) => get<Pipeline>(`/api/pipelines/${id}`),
      create: (dataRoomId, data) => post<Pipeline>(`/api/data-rooms/${dataRoomId}/pipelines`, data),
      update: (id, data) => patch<Pipeline>(`/api/pipelines/${id}`, data),
      delete: (id) => del(`/api/pipelines/${id}`),
      getRuns: (pipelineId) => get<PipelineRun[]>(`/api/pipelines/${pipelineId}/runs`),
    },
    pipelineRuns: {
      get: (id) => get<PipelineRun>(`/api/pipeline-runs/${id}`),
      getByFileVersion: (fileVersionId) => get<PipelineRun | null>(`/api/file-versions/${fileVersionId}/pipeline-run`),
      create: (data) => post<PipelineRun>('/api/pipeline-runs', data),
      retry: (id) => post<PipelineRun>(`/api/pipeline-runs/${id}/retry`, {}),
    },
  };
}

// React context for API client
export const ApiContext = createContext<ApiClient | null>(null);

export function useApi(): ApiClient {
  const api = useContext(ApiContext);
  if (!api) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return api;
}
