import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Label</Badge>);
    expect(screen.getByText('Label')).toBeInTheDocument();
  });

  it('applies default variant classes', () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText('Default')).toHaveClass('bg-surface-2');
  });

  it('applies primary variant classes', () => {
    render(<Badge variant="primary">Primary</Badge>);
    expect(screen.getByText('Primary')).toHaveClass('bg-primary/10');
  });

  it('applies success variant classes', () => {
    render(<Badge variant="success">Success</Badge>);
    expect(screen.getByText('Success')).toHaveClass('bg-green-500/10');
  });

  it('applies warning variant classes', () => {
    render(<Badge variant="warning">Warning</Badge>);
    expect(screen.getByText('Warning')).toHaveClass('bg-yellow-500/10');
  });

  it('applies error variant classes', () => {
    render(<Badge variant="error">Error</Badge>);
    expect(screen.getByText('Error')).toHaveClass('bg-red-500/10');
  });

  it('applies sm size classes', () => {
    render(<Badge size="sm">Small</Badge>);
    expect(screen.getByText('Small')).toHaveClass('text-[10px]');
  });

  it('applies md size classes', () => {
    render(<Badge size="md">Medium</Badge>);
    expect(screen.getByText('Medium')).toHaveClass('text-xs');
  });

  it('merges custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>);
    expect(screen.getByText('Custom')).toHaveClass('custom-class');
  });
});
