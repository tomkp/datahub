import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WhatsNew, WhatsNewButton } from './WhatsNew';

const mockChangelog = [
  {
    date: '2024-01-20',
    title: 'File Type Badges',
    description: 'Added file type badges to quickly identify file types.',
  },
  {
    date: '2024-01-15',
    title: 'Keyboard Navigation',
    description: 'Enhanced keyboard navigation for better accessibility.',
  },
];

describe('WhatsNew', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders changelog entries', () => {
    render(<WhatsNew changelog={mockChangelog} onClose={() => {}} />);
    expect(screen.getByText('File Type Badges')).toBeInTheDocument();
    expect(screen.getByText('Keyboard Navigation')).toBeInTheDocument();
  });

  it('renders dates for entries', () => {
    render(<WhatsNew changelog={mockChangelog} onClose={() => {}} />);
    expect(screen.getByText(/jan 20, 2024/i)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<WhatsNew changelog={mockChangelog} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has accessible panel role', () => {
    render(<WhatsNew changelog={mockChangelog} onClose={() => {}} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('WhatsNewButton', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows badge when there are unread changes', () => {
    render(<WhatsNewButton changelog={mockChangelog} />);
    expect(screen.getByTestId('unread-badge')).toBeInTheDocument();
  });

  it('hides badge after viewing changes', () => {
    const { rerender } = render(<WhatsNewButton changelog={mockChangelog} />);

    // Open panel
    fireEvent.click(screen.getByRole('button'));

    // Close panel
    fireEvent.click(screen.getByRole('button', { name: /close/i }));

    rerender(<WhatsNewButton changelog={mockChangelog} />);
    expect(screen.queryByTestId('unread-badge')).not.toBeInTheDocument();
  });

  it('renders button with accessible label', () => {
    render(<WhatsNewButton changelog={mockChangelog} />);
    expect(screen.getByRole('button', { name: /what's new/i })).toBeInTheDocument();
  });
});
