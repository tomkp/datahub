import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ApiContext, type ApiClient } from '../lib/api';
import { ToastProvider } from './ui/Toast';
import { FileDetailSidebar } from './FileDetailSidebar';

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
    <BrowserRouter>
      <ApiContext.Provider value={api}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>{children}</ToastProvider>
        </QueryClientProvider>
      </ApiContext.Provider>
    </BrowserRouter>
  );
};

const mockFile = {
  id: 'file-1',
  name: 'test-document.pdf',
  dataRoomId: 'room-1',
  folderId: 'folder-1',
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-20T14:45:00Z',
};

const mockVersions = [
  {
    id: 'version-2',
    fileId: 'file-1',
    storageUrl: '/storage/v2',
    uploadedBy: 'user-1',
    uploadedAt: '2024-01-20T14:45:00Z',
    createdAt: '2024-01-20T14:45:00Z',
    updatedAt: '2024-01-20T14:45:00Z',
  },
  {
    id: 'version-1',
    fileId: 'file-1',
    storageUrl: '/storage/v1',
    uploadedBy: 'user-1',
    uploadedAt: '2024-01-15T10:30:00Z',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
];

const mockPipelineRun = {
  id: 'run-1',
  pipelineId: 'pipeline-1',
  fileVersionId: 'version-2',
  status: 'processed' as const,
  createdAt: '2024-01-20T14:46:00Z',
  updatedAt: '2024-01-20T14:50:00Z',
  runSteps: [
    {
      id: 'step-1',
      pipelineRunId: 'run-1',
      step: 'Malware Scan',
      status: 'processed' as const,
      createdAt: '2024-01-20T14:46:00Z',
      updatedAt: '2024-01-20T14:47:00Z',
      errorMessage: undefined,
    },
    {
      id: 'step-2',
      pipelineRunId: 'run-1',
      step: 'PII Scan',
      status: 'processed' as const,
      createdAt: '2024-01-20T14:47:00Z',
      updatedAt: '2024-01-20T14:50:00Z',
      errorMessage: undefined,
    },
  ],
};

describe('FileDetailSidebar', () => {
  let api: ApiClient;
  let mockClipboard: { writeText: ReturnType<typeof vi.fn> };
  let mockWindowOpen: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    api = createMockApi();
    mockClipboard = { writeText: vi.fn() };
    Object.assign(navigator, { clipboard: mockClipboard });
    mockWindowOpen = vi.fn();
    Object.assign(window, { open: mockWindowOpen });
  });

  it('renders file name', async () => {
    api.files.get = vi.fn().mockResolvedValue(mockFile);
    api.files.getVersions = vi.fn().mockResolvedValue(mockVersions);
    api.pipelineRuns.getByFileVersion = vi.fn().mockResolvedValue(null);

    render(<FileDetailSidebar fileId="file-1" onClose={() => {}} />, {
      wrapper: createWrapper(api),
    });

    expect(await screen.findByText('test-document.pdf')).toBeInTheDocument();
  });

  it('renders file creation date', async () => {
    api.files.get = vi.fn().mockResolvedValue(mockFile);
    api.files.getVersions = vi.fn().mockResolvedValue(mockVersions);
    api.pipelineRuns.getByFileVersion = vi.fn().mockResolvedValue(null);

    render(<FileDetailSidebar fileId="file-1" onClose={() => {}} />, {
      wrapper: createWrapper(api),
    });

    expect(await screen.findByText(/created/i)).toBeInTheDocument();
    expect(await screen.findAllByText(/jan 15, 2024/i)).toHaveLength(2); // File created + version
  });

  it('renders file modification date', async () => {
    api.files.get = vi.fn().mockResolvedValue(mockFile);
    api.files.getVersions = vi.fn().mockResolvedValue(mockVersions);
    api.pipelineRuns.getByFileVersion = vi.fn().mockResolvedValue(null);

    render(<FileDetailSidebar fileId="file-1" onClose={() => {}} />, {
      wrapper: createWrapper(api),
    });

    expect(await screen.findByText(/modified/i)).toBeInTheDocument();
    expect(await screen.findAllByText(/jan 20, 2024/i)).toHaveLength(2); // File modified + latest version
  });

  it('renders version history list', async () => {
    api.files.get = vi.fn().mockResolvedValue(mockFile);
    api.files.getVersions = vi.fn().mockResolvedValue(mockVersions);
    api.pipelineRuns.getByFileVersion = vi.fn().mockResolvedValue(null);

    render(<FileDetailSidebar fileId="file-1" onClose={() => {}} />, {
      wrapper: createWrapper(api),
    });

    expect(await screen.findByText('v2')).toBeInTheDocument();
    expect(await screen.findByText('v1')).toBeInTheDocument();
    expect(await screen.findByText('Latest')).toBeInTheDocument();
  });

  it('handles copy link button click', async () => {
    api.files.get = vi.fn().mockResolvedValue(mockFile);
    api.files.getVersions = vi.fn().mockResolvedValue(mockVersions);
    api.pipelineRuns.getByFileVersion = vi.fn().mockResolvedValue(null);
    mockClipboard.writeText.mockResolvedValue(undefined);

    render(<FileDetailSidebar fileId="file-1" onClose={() => {}} />, {
      wrapper: createWrapper(api),
    });

    const copyButton = await screen.findByRole('button', { name: /copy link/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('/files/file-1')
      );
    });
  });

  it('handles download button click', async () => {
    api.files.get = vi.fn().mockResolvedValue(mockFile);
    api.files.getVersions = vi.fn().mockResolvedValue(mockVersions);
    api.pipelineRuns.getByFileVersion = vi.fn().mockResolvedValue(null);

    render(<FileDetailSidebar fileId="file-1" onClose={() => {}} />, {
      wrapper: createWrapper(api),
    });

    const downloadButtons = await screen.findAllByRole('button', { name: /download/i });
    const mainDownloadButton = downloadButtons.find(btn => btn.textContent === 'Download');
    fireEvent.click(mainDownloadButton!);

    await waitFor(() => {
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'http://localhost:3001/api/file-versions/version-2/download',
        '_blank'
      );
    });
  });

  it('disables download button when no versions', async () => {
    api.files.get = vi.fn().mockResolvedValue(mockFile);
    api.files.getVersions = vi.fn().mockResolvedValue([]);
    api.pipelineRuns.getByFileVersion = vi.fn().mockResolvedValue(null);

    render(<FileDetailSidebar fileId="file-1" onClose={() => {}} />, {
      wrapper: createWrapper(api),
    });

    const downloadButtons = await screen.findAllByRole('button', { name: /download/i });
    const mainDownloadButton = downloadButtons.find(btn => btn.textContent === 'Download');
    expect(mainDownloadButton).toBeDisabled();
  });

  it('handles upload version button click', async () => {
    api.files.get = vi.fn().mockResolvedValue(mockFile);
    api.files.getVersions = vi.fn().mockResolvedValue(mockVersions);
    api.pipelineRuns.getByFileVersion = vi.fn().mockResolvedValue(null);
    api.files.uploadVersion = vi.fn().mockResolvedValue({});

    render(<FileDetailSidebar fileId="file-1" onClose={() => {}} />, {
      wrapper: createWrapper(api),
    });

    const uploadButton = await screen.findByRole('button', { name: /upload version/i });
    expect(uploadButton).toBeInTheDocument();
    fireEvent.click(uploadButton);

    // File input should be present
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
  });

  it('displays pipeline progress when available', async () => {
    api.files.get = vi.fn().mockResolvedValue(mockFile);
    api.files.getVersions = vi.fn().mockResolvedValue(mockVersions);
    api.pipelineRuns.getByFileVersion = vi.fn().mockResolvedValue(mockPipelineRun);

    render(<FileDetailSidebar fileId="file-1" onClose={() => {}} />, {
      wrapper: createWrapper(api),
    });

    expect(await screen.findByText(/pipeline status/i)).toBeInTheDocument();
    expect(await screen.findByText('Malware Scan')).toBeInTheDocument();
    expect(await screen.findByText('PII Scan')).toBeInTheDocument();
  });

  it('displays message when no pipeline run available', async () => {
    api.files.get = vi.fn().mockResolvedValue(mockFile);
    api.files.getVersions = vi.fn().mockResolvedValue(mockVersions);
    api.pipelineRuns.getByFileVersion = vi.fn().mockResolvedValue(null);

    render(<FileDetailSidebar fileId="file-1" onClose={() => {}} />, {
      wrapper: createWrapper(api),
    });

    expect(await screen.findByText(/no pipeline run for this version/i)).toBeInTheDocument();
  });

  it('displays loading state', () => {
    api.files.get = vi.fn().mockImplementation(() => new Promise(() => {}));
    api.files.getVersions = vi.fn().mockResolvedValue([]);
    api.pipelineRuns.getByFileVersion = vi.fn().mockResolvedValue(null);

    render(<FileDetailSidebar fileId="file-1" onClose={() => {}} />, {
      wrapper: createWrapper(api),
    });

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays error state', async () => {
    api.files.get = vi.fn().mockRejectedValue(new Error('Failed to load'));
    api.files.getVersions = vi.fn().mockResolvedValue([]);
    api.pipelineRuns.getByFileVersion = vi.fn().mockResolvedValue(null);

    render(<FileDetailSidebar fileId="file-1" onClose={() => {}} />, {
      wrapper: createWrapper(api),
    });

    expect(await screen.findByText(/failed to load file/i)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    api.files.get = vi.fn().mockResolvedValue(mockFile);
    api.files.getVersions = vi.fn().mockResolvedValue(mockVersions);
    api.pipelineRuns.getByFileVersion = vi.fn().mockResolvedValue(null);

    render(<FileDetailSidebar fileId="file-1" onClose={onClose} />, {
      wrapper: createWrapper(api),
    });

    const closeButton = await screen.findByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
