import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileDetailsPanel } from './FileDetailsPanel';

const mockFile = {
  id: 'file-1',
  name: 'report.csv',
  dataRoomId: 'room-1',
  folderId: 'folder-1',
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-20T14:45:00Z',
};

describe('FileDetailsPanel', () => {
  it('renders file name', () => {
    render(<FileDetailsPanel file={mockFile} onClose={() => {}} />);
    expect(screen.getByText('report.csv')).toBeInTheDocument();
  });

  it('renders file type badge', () => {
    render(<FileDetailsPanel file={mockFile} onClose={() => {}} />);
    expect(screen.getByText('CSV')).toBeInTheDocument();
  });

  it('renders creation date', () => {
    render(<FileDetailsPanel file={mockFile} onClose={() => {}} />);
    expect(screen.getByText(/created/i)).toBeInTheDocument();
  });

  it('renders modification date', () => {
    render(<FileDetailsPanel file={mockFile} onClose={() => {}} />);
    expect(screen.getByText(/modified/i)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<FileDetailsPanel file={mockFile} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(<FileDetailsPanel file={mockFile} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has accessible role and label', () => {
    render(<FileDetailsPanel file={mockFile} onClose={() => {}} />);
    expect(screen.getByRole('complementary')).toBeInTheDocument();
    expect(screen.getByLabelText(/file details/i)).toBeInTheDocument();
  });

  it('renders nothing when file is null', () => {
    const { container } = render(<FileDetailsPanel file={null} onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('displays version count when provided', () => {
    render(<FileDetailsPanel file={mockFile} versionCount={5} onClose={() => {}} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(/versions/i)).toBeInTheDocument();
  });
});
