import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PipelineProgress } from './PipelineProgress';

const mockSteps = [
  {
    step: 'malware_scan',
    status: 'processed' as const,
    startedAt: '2024-01-20T10:00:00Z',
    completedAt: '2024-01-20T10:01:00Z',
  },
  {
    step: 'pii_scan',
    status: 'processing' as const,
    startedAt: '2024-01-20T10:01:00Z',
  },
  {
    step: 'data_validation',
    status: 'pending' as const,
  },
];

const mockErrorStep = {
  step: 'ingestion',
  status: 'errored' as const,
  startedAt: '2024-01-20T10:02:00Z',
  completedAt: '2024-01-20T10:02:30Z',
  errorMessage: 'Failed to ingest data: Invalid format',
};

describe('PipelineProgress', () => {
  it('renders all pipeline steps', () => {
    render(<PipelineProgress steps={mockSteps} />);
    expect(screen.getByText(/malware scan/i)).toBeInTheDocument();
    expect(screen.getByText(/pii scan/i)).toBeInTheDocument();
    expect(screen.getByText(/data validation/i)).toBeInTheDocument();
  });

  it('shows visual status indicators for each step', () => {
    render(<PipelineProgress steps={mockSteps} />);
    // Verify data-status attributes are set correctly
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveAttribute('data-status', 'processed');
    expect(items[1]).toHaveAttribute('data-status', 'processing');
    expect(items[2]).toHaveAttribute('data-status', 'pending');
  });

  it('shows running indicator for processing steps', () => {
    render(<PipelineProgress steps={mockSteps} />);
    expect(screen.getByText('Running...')).toBeInTheDocument();
  });

  it('shows error message for failed steps', () => {
    render(<PipelineProgress steps={[mockErrorStep]} />);
    expect(screen.getByText(/failed to ingest/i)).toBeInTheDocument();
  });

  it('allows collapsing and expanding step details', () => {
    render(<PipelineProgress steps={[mockErrorStep]} />);
    // Error steps start expanded
    expect(screen.getByText(/failed to ingest data/i)).toBeInTheDocument();
    // Click to collapse
    const collapseButton = screen.getByRole('button', { name: /collapse/i });
    fireEvent.click(collapseButton);
    // Click to expand again
    const expandButton = screen.getByRole('button', { name: /expand/i });
    fireEvent.click(expandButton);
    expect(screen.getByText(/failed to ingest data/i)).toBeInTheDocument();
  });

  it('has accessible structure', () => {
    render(<PipelineProgress steps={mockSteps} />);
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('shows completion indicator for processed steps', () => {
    render(<PipelineProgress steps={mockSteps} />);
    const processedStep = screen.getByText(/malware scan/i).closest('li');
    expect(processedStep).toHaveAttribute('data-status', 'processed');
  });

  it('shows duration when step is complete', () => {
    render(<PipelineProgress steps={mockSteps} />);
    expect(screen.getByText(/1m/i)).toBeInTheDocument();
  });
});
