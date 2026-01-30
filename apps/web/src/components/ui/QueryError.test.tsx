import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryError } from './QueryError';

describe('QueryError', () => {
  it('renders with default title and message', () => {
    render(<QueryError message="Failed to load data" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(<QueryError title="Connection Error" message="Network unavailable" />);
    expect(screen.getByText('Connection Error')).toBeInTheDocument();
    expect(screen.getByText('Network unavailable')).toBeInTheDocument();
  });

  it('renders retry button when onRetry is provided', () => {
    const onRetry = vi.fn();
    render(<QueryError message="Failed to load" onRetry={onRetry} />);
    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('hides retry button when onRetry is not provided', () => {
    render(<QueryError message="Failed to load" />);
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    render(<QueryError message="Failed to load" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('applies compact size', () => {
    render(<QueryError message="Error" size="compact" />);
    expect(screen.getByRole('alert')).toHaveClass('p-3');
  });

  it('applies default size', () => {
    render(<QueryError message="Error" size="default" />);
    expect(screen.getByRole('alert')).toHaveClass('p-4');
  });

  it('applies full size', () => {
    render(<QueryError message="Error" size="full" />);
    expect(screen.getByRole('alert')).toHaveClass('p-6');
  });

  it('has accessible error icon', () => {
    render(<QueryError message="Error occurred" />);
    expect(screen.getByLabelText('Error')).toBeInTheDocument();
  });

  it('merges custom className', () => {
    render(<QueryError message="Error" className="custom-class" />);
    expect(screen.getByRole('alert')).toHaveClass('custom-class');
  });
});
