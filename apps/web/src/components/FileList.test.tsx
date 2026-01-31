import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createMockApi, createTestWrapper } from '../test-utils/setup';
import { FileList } from './FileList';

describe('FileList', () => {
  it('renders files in a folder', async () => {
    const api = createMockApi({
      folders: {
        getFiles: vi.fn().mockResolvedValue([
          { id: 'file1', name: 'report.pdf', folderId: 'f1', dataRoomId: 'r1' },
          { id: 'file2', name: 'data.csv', folderId: 'f1', dataRoomId: 'r1' },
        ]),
      },
    });

    render(<FileList folderId="f1" />, { wrapper: createTestWrapper(api, { useBrowserRouter: true }) });

    expect(await screen.findByText('report.pdf')).toBeInTheDocument();
    expect(await screen.findByText('data.csv')).toBeInTheDocument();
  });

  it('renders loading skeleton', () => {
    const api = createMockApi({
      folders: {
        getFiles: vi.fn().mockImplementation(() => new Promise(() => {})),
      },
    });

    render(<FileList folderId="f1" />, { wrapper: createTestWrapper(api, { useBrowserRouter: true }) });

    expect(screen.getByTestId('file-loading')).toBeInTheDocument();
  });

  it('renders empty state when no files', async () => {
    const api = createMockApi({
      folders: {
        getFiles: vi.fn().mockResolvedValue([]),
      },
    });

    render(<FileList folderId="f1" />, { wrapper: createTestWrapper(api, { useBrowserRouter: true }) });

    expect(await screen.findByText(/no files/i)).toBeInTheDocument();
  });

  it('does not render when folderId is empty', () => {
    const api = createMockApi();

    render(<FileList folderId="" />, { wrapper: createTestWrapper(api, { useBrowserRouter: true }) });

    expect(screen.queryByTestId('file-list')).not.toBeInTheDocument();
  });

  it('renders PipelineStatusIcon correctly for processed status', async () => {
    const api = createMockApi({
      folders: {
        getFiles: vi.fn().mockResolvedValue([
          { id: 'file1', name: 'report.pdf', folderId: 'f1', dataRoomId: 'r1', pipelineStatus: 'processed' },
        ]),
      },
    });

    render(<FileList folderId="f1" />, { wrapper: createTestWrapper(api, { useBrowserRouter: true }) });

    const statusIcon = await screen.findByTitle('Processed');
    expect(statusIcon).toBeInTheDocument();
    expect(statusIcon.querySelector('svg.lucide-check')).toBeInTheDocument();
  });

  it('renders PipelineStatusIcon correctly for processing status', async () => {
    const api = createMockApi({
      folders: {
        getFiles: vi.fn().mockResolvedValue([
          { id: 'file1', name: 'report.pdf', folderId: 'f1', dataRoomId: 'r1', pipelineStatus: 'processing' },
        ]),
      },
    });

    render(<FileList folderId="f1" />, { wrapper: createTestWrapper(api, { useBrowserRouter: true }) });

    const statusIcon = await screen.findByTitle('Processing');
    expect(statusIcon).toBeInTheDocument();
    expect(statusIcon.querySelector('svg.lucide-loader-circle')).toBeInTheDocument();
  });

  it('renders PipelineStatusIcon correctly for errored status', async () => {
    const api = createMockApi({
      folders: {
        getFiles: vi.fn().mockResolvedValue([
          { id: 'file1', name: 'report.pdf', folderId: 'f1', dataRoomId: 'r1', pipelineStatus: 'errored' },
        ]),
      },
    });

    render(<FileList folderId="f1" />, { wrapper: createTestWrapper(api, { useBrowserRouter: true }) });

    const statusIcon = await screen.findByTitle('Error');
    expect(statusIcon).toBeInTheDocument();
    expect(statusIcon).toHaveClass('bg-red-500');
  });

  it('calls onSelectFile when file row is clicked', async () => {
    const onSelectFile = vi.fn();
    const mockFile = { id: 'file1', name: 'report.pdf', folderId: 'f1', dataRoomId: 'r1' };
    const api = createMockApi({
      folders: {
        getFiles: vi.fn().mockResolvedValue([mockFile]),
      },
    });

    render(<FileList folderId="f1" onSelectFile={onSelectFile} />, { wrapper: createTestWrapper(api, { useBrowserRouter: true }) });

    const fileRow = await screen.findByText('report.pdf');
    fireEvent.click(fileRow.closest('tr')!);

    expect(onSelectFile).toHaveBeenCalledTimes(1);
    expect(onSelectFile).toHaveBeenCalledWith(mockFile);
  });

  it('highlights selected file with selectedFileId prop', async () => {
    const api = createMockApi({
      folders: {
        getFiles: vi.fn().mockResolvedValue([
          { id: 'file1', name: 'report.pdf', folderId: 'f1', dataRoomId: 'r1' },
          { id: 'file2', name: 'data.csv', folderId: 'f1', dataRoomId: 'r1' },
        ]),
      },
    });

    render(<FileList folderId="f1" selectedFileId="file1" />, { wrapper: createTestWrapper(api, { useBrowserRouter: true }) });

    const selectedRow = (await screen.findByText('report.pdf')).closest('tr');
    const unselectedRow = (await screen.findByText('data.csv')).closest('tr');

    expect(selectedRow).toHaveClass('bg-primary/5');
    expect(unselectedRow).not.toHaveClass('bg-primary/5');
  });

  it('renders pipeline status column in table header', async () => {
    const api = createMockApi({
      folders: {
        getFiles: vi.fn().mockResolvedValue([
          { id: 'file1', name: 'report.pdf', folderId: 'f1', dataRoomId: 'r1', pipelineStatus: 'processed' },
        ]),
      },
    });

    render(<FileList folderId="f1" />, { wrapper: createTestWrapper(api, { useBrowserRouter: true }) });

    expect(await screen.findByText('Status')).toBeInTheDocument();
  });
});
