import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileDropzone } from './FileDropzone';
import { ToastProvider } from './ui/Toast';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
);

describe('FileDropzone', () => {
  it('renders drop zone with default message', () => {
    render(<FileDropzone onUpload={vi.fn()} />, { wrapper });
    expect(
      screen.getByText(/drag and drop files here/i)
    ).toBeInTheDocument();
  });

  it('shows active state when dragging over', () => {
    render(<FileDropzone onUpload={vi.fn()} />, { wrapper });
    const dropzone = screen.getByTestId('dropzone');

    fireEvent.dragEnter(dropzone);
    expect(dropzone).toHaveClass('border-primary');

    fireEvent.dragLeave(dropzone);
    expect(dropzone).not.toHaveClass('border-primary');
  });

  it('accepts valid file types', async () => {
    const onUpload = vi.fn();
    render(<FileDropzone onUpload={onUpload} />, { wrapper });

    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    const dropzone = screen.getByTestId('dropzone');

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith([file]);
    });
  });

  it('rejects unsupported file types', async () => {
    const onUpload = vi.fn();
    render(<FileDropzone onUpload={onUpload} />, { wrapper });

    const file = new File(['test'], 'test.exe', {
      type: 'application/x-executable',
    });
    const dropzone = screen.getByTestId('dropzone');

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(onUpload).not.toHaveBeenCalled();
    });
  });

  it('rejects files exceeding size limit', async () => {
    const onUpload = vi.fn();
    render(<FileDropzone onUpload={onUpload} maxSizeMB={1} />, { wrapper });

    // Create a mock file that reports 2MB size
    const file = new File(['x'.repeat(2 * 1024 * 1024)], 'large.csv', {
      type: 'text/csv',
    });
    Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 });

    const dropzone = screen.getByTestId('dropzone');

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(onUpload).not.toHaveBeenCalled();
    });
  });

  it('accepts multiple files', async () => {
    const onUpload = vi.fn();
    render(<FileDropzone onUpload={onUpload} />, { wrapper });

    const files = [
      new File(['test1'], 'test1.csv', { type: 'text/csv' }),
      new File(['test2'], 'test2.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    ];
    const dropzone = screen.getByTestId('dropzone');

    fireEvent.drop(dropzone, {
      dataTransfer: { files },
    });

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith(files);
    });
  });

  it('opens file dialog when clicked', () => {
    render(<FileDropzone onUpload={vi.fn()} />, { wrapper });
    const dropzone = screen.getByTestId('dropzone');
    const input = screen.getByTestId('file-input');

    const clickSpy = vi.spyOn(input, 'click');
    fireEvent.click(dropzone);

    expect(clickSpy).toHaveBeenCalled();
  });

  it('shows file type hint', () => {
    render(<FileDropzone onUpload={vi.fn()} />, { wrapper });
    expect(
      screen.getByText(/CSV, TSV, Excel/i)
    ).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(<FileDropzone onUpload={vi.fn()} disabled />, { wrapper });
    const dropzone = screen.getByTestId('dropzone');
    expect(dropzone).toHaveClass('opacity-50');
  });
});
