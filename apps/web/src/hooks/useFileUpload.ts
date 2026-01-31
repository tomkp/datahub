import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApi } from '../lib/api';
import type { UploadItem } from '../components/UploadProgress';

export function useFileUpload(folderId: string) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const api = useApi();
  const queryClient = useQueryClient();

  const updateUpload = useCallback((id: string, updates: Partial<UploadItem>) => {
    setUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updates } : u))
    );
  }, []);

  const removeUpload = useCallback((id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setUploads((prev) => prev.filter((u) => u.status !== 'completed'));
  }, []);

  const uploadFile = useCallback(
    async (file: File): Promise<void> => {
      const uploadId = crypto.randomUUID();

      setUploads((prev) => [
        ...prev,
        {
          id: uploadId,
          fileName: file.name,
          progress: 0,
          status: 'uploading',
        },
      ]);

      try {
        // Use XMLHttpRequest for progress tracking
        await new Promise<void>((resolve, reject) => {
          const xhr = new window.XMLHttpRequest();
          const formData = new FormData();
          formData.append('file', file);

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              updateUpload(uploadId, { progress });
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              updateUpload(uploadId, { progress: 100, status: 'completed' });
              queryClient.invalidateQueries({ queryKey: ['files', folderId] });
              resolve();
            } else {
              const errorMessage =
                xhr.responseText || `Upload failed with status ${xhr.status}`;
              updateUpload(uploadId, { status: 'error', error: errorMessage });
              reject(new Error(errorMessage));
            }
          });

          xhr.addEventListener('error', () => {
            updateUpload(uploadId, {
              status: 'error',
              error: 'Network error occurred',
            });
            reject(new Error('Network error'));
          });

          xhr.addEventListener('abort', () => {
            updateUpload(uploadId, {
              status: 'error',
              error: 'Upload was cancelled',
            });
            reject(new Error('Upload cancelled'));
          });

          xhr.open('POST', `${api.baseUrl}/api/folders/${folderId}/files`);
          xhr.setRequestHeader('Authorization', `Bearer ${api.token}`);
          xhr.send(formData);
        });
      } catch {
        // Error already handled in the promise
      }
    },
    [folderId, api.baseUrl, api.token, queryClient, updateUpload]
  );

  const uploadFiles = useCallback(
    async (files: File[]) => {
      // Upload files sequentially to avoid overwhelming the server
      for (const file of files) {
        await uploadFile(file);
      }
    },
    [uploadFile]
  );

  return {
    uploads,
    uploadFiles,
    removeUpload,
    clearCompleted,
  };
}
