import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PageHeader } from './PageHeader';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('PageHeader', () => {
  it('renders title', () => {
    render(<PageHeader title="Test Title" />, { wrapper });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Test Title'
    );
  });

  it('renders description when provided', () => {
    render(<PageHeader title="Title" description="Test description" />, {
      wrapper,
    });
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('renders breadcrumbs when provided', () => {
    render(
      <PageHeader
        title="Title"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Current Page' },
        ]}
      />,
      { wrapper }
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Current Page')).toBeInTheDocument();
  });

  it('renders breadcrumb links correctly', () => {
    render(
      <PageHeader
        title="Title"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Current' },
        ]}
      />,
      { wrapper }
    );
    const homeLink = screen.getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renders actions when provided', () => {
    render(
      <PageHeader
        title="Title"
        actions={<button data-testid="action-btn">Action</button>}
      />,
      { wrapper }
    );
    expect(screen.getByTestId('action-btn')).toBeInTheDocument();
  });
});
