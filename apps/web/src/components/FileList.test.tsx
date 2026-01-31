import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v6';
import { ApiContext, type ApiClient } from '../lib/api';
import { FileList } from './FileList';

const createMockApi = (): ApiClient => ({
  baseUrl: 'http://localhost:3001',
  token: 'test-token',
  tenants: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  dataRooms: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getFolders: vi.fn(),
      getPipelineRuns: vi.fn(),
  },
  folders: {
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getFiles: vi.fn(),
  },
  files: {
    get: vi.fn(),
    upload: vi.fn(),
    uploadVersion: vi.fn(),
    delete: vi.fn(),
    getVersions: vi.fn(),
  },
  pipelines: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getRuns: vi.fn(),
  },
  pipelineRuns: {
    get: vi.fn(),
    getByFileVersion: vi.fn(),
    create: vi.fn(),
    retry: vi.fn(),
  },
});

const createWrapper = (api: ApiClient) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <NuqsAdapter>
        <ApiContext.Provider value={api}>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </ApiContext.Provider>
      </NuqsAdapter>
    </BrowserRouter>
  );
};

describe('FileList', () => {
  it('renders files in a folder', async () => {
    const api = createMockApi();
    api.folders.getFiles = vi.fn().mockResolvedValue([
      { id: 'file1', name: 'report.pdf', folderId: 'f1', dataRoomId: 'r1' },
      { id: 'file2', name: 'data.csv', folderId: 'f1', dataRoomId: 'r1' },
    ]);

    render(<FileList folderId="f1" />, { wrapper: createWrapper(api) });

    expect(await screen.findByText('report.pdf')).toBeInTheDocument();
    expect(await screen.findByText('data.csv')).toBeInTheDocument();
  });

  it('renders loading skeleton', () => {
    const api = createMockApi();
    api.folders.getFiles = vi.fn().mockImplementation(() => new Promise(() => {}));

    render(<FileList folderId="f1" />, { wrapper: createWrapper(api) });

    expect(screen.getByTestId('file-loading')).toBeInTheDocument();
  });

  it('renders empty state when no files', async () => {
    const api = createMockApi();
    api.folders.getFiles = vi.fn().mockResolvedValue([]);

    render(<FileList folderId="f1" />, { wrapper: createWrapper(api) });

    expect(await screen.findByText(/no files/i)).toBeInTheDocument();
  });

  it('does not render when folderId is empty', () => {
    const api = createMockApi();

    render(<FileList folderId="" />, { wrapper: createWrapper(api) });

    expect(screen.queryByTestId('file-list')).not.toBeInTheDocument();
  });

  it('renders PipelineStatusIcon correctly for processed status', async () => {
    const api = createMockApi();
    api.folders.getFiles = vi.fn().mockResolvedValue([
      { id: 'file1', name: 'report.pdf', folderId: 'f1', dataRoomId: 'r1', pipelineStatus: 'processed' },
    ]);

    render(<FileList folderId="f1" />, { wrapper: createWrapper(api) });

    const statusIcon = await screen.findByTitle('Processed');
    expect(statusIcon).toBeInTheDocument();
    expect(statusIcon.querySelector('svg.lucide-check')).toBeInTheDocument();
  });

  it('renders PipelineStatusIcon correctly for processing status', async () => {
    const api = createMockApi();
    api.folders.getFiles = vi.fn().mockResolvedValue([
      { id: 'file1', name: 'report.pdf', folderId: 'f1', dataRoomId: 'r1', pipelineStatus: 'processing' },
    ]);

    render(<FileList folderId="f1" />, { wrapper: createWrapper(api) });

    const statusIcon = await screen.findByTitle('Processing');
    expect(statusIcon).toBeInTheDocument();
    expect(statusIcon.querySelector('svg.lucide-loader-circle')).toBeInTheDocument();
  });

  it('renders PipelineStatusIcon correctly for errored status', async () => {
    const api = createMockApi();
    api.folders.getFiles = vi.fn().mockResolvedValue([
      { id: 'file1', name: 'report.pdf', folderId: 'f1', dataRoomId: 'r1', pipelineStatus: 'errored' },
    ]);

    render(<FileList folderId="f1" />, { wrapper: createWrapper(api) });

    const statusIcon = await screen.findByTitle('Error');
    expect(statusIcon).toBeInTheDocument();
    expect(statusIcon).toHaveClass('bg-red-500');
  });

  it('calls onSelectFile when file row is clicked', async () => {
    const api = createMockApi();
    const onSelectFile = vi.fn();
    const mockFile = { id: 'file1', name: 'report.pdf', folderId: 'f1', dataRoomId: 'r1' };
    api.folders.getFiles = vi.fn().mockResolvedValue([mockFile]);

    render(<FileList folderId="f1" onSelectFile={onSelectFile} />, { wrapper: createWrapper(api) });

    const fileRow = await screen.findByText('report.pdf');
    fireEvent.click(fileRow.closest('tr')!);

    expect(onSelectFile).toHaveBeenCalledTimes(1);
    expect(onSelectFile).toHaveBeenCalledWith(mockFile);
  });

  it('highlights selected file with selectedFileId prop', async () => {
    const api = createMockApi();
    api.folders.getFiles = vi.fn().mockResolvedValue([
      { id: 'file1', name: 'report.pdf', folderId: 'f1', dataRoomId: 'r1' },
      { id: 'file2', name: 'data.csv', folderId: 'f1', dataRoomId: 'r1' },
    ]);

    render(<FileList folderId="f1" selectedFileId="file1" />, { wrapper: createWrapper(api) });

    const selectedRow = (await screen.findByText('report.pdf')).closest('tr');
    const unselectedRow = (await screen.findByText('data.csv')).closest('tr');

    expect(selectedRow).toHaveClass('bg-primary/5');
    expect(unselectedRow).not.toHaveClass('bg-primary/5');
  });

  it('renders pipeline status column in table header', async () => {
    const api = createMockApi();
    api.folders.getFiles = vi.fn().mockResolvedValue([
      { id: 'file1', name: 'report.pdf', folderId: 'f1', dataRoomId: 'r1', pipelineStatus: 'processed' },
    ]);

    render(<FileList folderId="f1" />, { wrapper: createWrapper(api) });

    expect(await screen.findByText('Status')).toBeInTheDocument();
  });
});
