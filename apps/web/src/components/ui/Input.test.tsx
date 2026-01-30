import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './Input';

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    const { rerender } = render(<Input variant="default" />);
    expect(screen.getByRole('textbox')).toHaveClass('border-border');

    rerender(<Input variant="ghost" />);
    expect(screen.getByRole('textbox')).toHaveClass('border-transparent');
    expect(screen.getByRole('textbox')).toHaveClass('bg-surface-2');
  });

  it('applies size classes', () => {
    const { rerender } = render(<Input size="sm" />);
    expect(screen.getByRole('textbox')).toHaveClass('h-7');

    rerender(<Input size="lg" />);
    expect(screen.getByRole('textbox')).toHaveClass('h-9');
  });

  it('handles value changes', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('accepts placeholder', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('forwards ref', () => {
    const ref = vi.fn();
    render(<Input ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it('merges custom className', () => {
    render(<Input className="custom-class" />);
    expect(screen.getByRole('textbox')).toHaveClass('custom-class');
  });
});
