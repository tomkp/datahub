import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UploadProgress, type UploadItem } from './UploadProgress';

describe('UploadProgress', () => {
  it('renders nothing when uploads array is empty', () => {
    const { container } = render(<UploadProgress uploads={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders upload items', () => {
    const uploads: UploadItem[] = [
      { id: '1', fileName: 'test.csv', progress: 50, status: 'uploading' },
    ];
    render(<UploadProgress uploads={uploads} />);
    expect(screen.getByText('test.csv')).toBeInTheDocument();
  });

  it('shows progress bar with correct percentage', () => {
    const uploads: UploadItem[] = [
      { id: '1', fileName: 'test.csv', progress: 75, status: 'uploading' },
    ];
    render(<UploadProgress uploads={uploads} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '75');
  });

  it('shows completed status', () => {
    const uploads: UploadItem[] = [
      { id: '1', fileName: 'test.csv', progress: 100, status: 'completed' },
    ];
    render(<UploadProgress uploads={uploads} />);
    expect(screen.getByText(/completed/i)).toBeInTheDocument();
  });

  it('shows error status with message', () => {
    const uploads: UploadItem[] = [
      {
        id: '1',
        fileName: 'test.csv',
        progress: 30,
        status: 'error',
        error: 'Network timeout',
      },
    ];
    render(<UploadProgress uploads={uploads} />);
    expect(screen.getByText(/network timeout/i)).toBeInTheDocument();
  });

  it('shows multiple uploads in queue', () => {
    const uploads: UploadItem[] = [
      { id: '1', fileName: 'file1.csv', progress: 100, status: 'completed' },
      { id: '2', fileName: 'file2.csv', progress: 50, status: 'uploading' },
      { id: '3', fileName: 'file3.csv', progress: 0, status: 'pending' },
    ];
    render(<UploadProgress uploads={uploads} />);
    expect(screen.getByText('file1.csv')).toBeInTheDocument();
    expect(screen.getByText('file2.csv')).toBeInTheDocument();
    expect(screen.getByText('file3.csv')).toBeInTheDocument();
  });

  it('shows pending status', () => {
    const uploads: UploadItem[] = [
      { id: '1', fileName: 'test.csv', progress: 0, status: 'pending' },
    ];
    render(<UploadProgress uploads={uploads} />);
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  it('displays progress percentage during upload', () => {
    const uploads: UploadItem[] = [
      { id: '1', fileName: 'test.csv', progress: 75, status: 'uploading' },
    ];
    render(<UploadProgress uploads={uploads} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });
});
