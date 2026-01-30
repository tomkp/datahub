import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('renders the application', () => {
    render(<App />);
    expect(screen.getByText('DataHub')).toBeInTheDocument();
  });

  // Accessibility tests
  describe('accessibility', () => {
    it('has navigation landmark with aria-label', () => {
      render(<App />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label');
    });

    it('has main landmark', () => {
      render(<App />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('has complementary landmark for sidebar', () => {
      render(<App />);
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toBeInTheDocument();
    });
  });
});
