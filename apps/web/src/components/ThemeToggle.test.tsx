import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    // Clear localStorage and reset document class
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('renders toggle button', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows light mode text when in dark mode', () => {
    document.documentElement.classList.add('dark');
    render(<ThemeToggle />);
    expect(screen.getByText('Light mode')).toBeInTheDocument();
  });

  it('shows dark mode text when in light mode', () => {
    render(<ThemeToggle />);
    expect(screen.getByText('Dark mode')).toBeInTheDocument();
  });

  it('toggles theme on click', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');

    // Initially light mode
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Click to switch to dark
    fireEvent.click(button);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Click to switch back to light
    fireEvent.click(button);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('persists theme to localStorage', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');

    fireEvent.click(button);
    expect(localStorage.getItem('theme')).toBe('dark');

    fireEvent.click(button);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('has accessible label', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
  });
});
