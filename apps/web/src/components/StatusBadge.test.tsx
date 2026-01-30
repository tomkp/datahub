import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders pending status with default variant', () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toHaveClass('bg-surface-2');
  });

  it('renders processing status with primary variant', () => {
    render(<StatusBadge status="processing" />);
    expect(screen.getByText('Processing')).toBeInTheDocument();
    expect(screen.getByText('Processing')).toHaveClass('bg-primary/10');
  });

  it('renders processed status with success variant', () => {
    render(<StatusBadge status="processed" />);
    expect(screen.getByText('Processed')).toBeInTheDocument();
    expect(screen.getByText('Processed')).toHaveClass('bg-green-500/10');
  });

  it('renders errored status with error variant', () => {
    render(<StatusBadge status="errored" />);
    expect(screen.getByText('Errored')).toBeInTheDocument();
    expect(screen.getByText('Errored')).toHaveClass('bg-red-500/10');
  });

  it('renders warned status with warning variant', () => {
    render(<StatusBadge status="warned" />);
    expect(screen.getByText('Warned')).toBeInTheDocument();
    expect(screen.getByText('Warned')).toHaveClass('bg-yellow-500/10');
  });

  it('applies custom className', () => {
    render(<StatusBadge status="processing" className="custom-class" />);
    expect(screen.getByText('Processing')).toHaveClass('custom-class');
  });

  it('supports small size', () => {
    render(<StatusBadge status="processing" size="sm" />);
    expect(screen.getByText('Processing')).toHaveClass('text-[10px]');
  });

  it('supports medium size', () => {
    render(<StatusBadge status="processing" size="md" />);
    expect(screen.getByText('Processing')).toHaveClass('text-xs');
  });

  it('shows processing indicator for processing status', () => {
    render(<StatusBadge status="processing" showIndicator />);
    const badge = screen.getByText('Processing').parentElement;
    expect(badge?.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});
