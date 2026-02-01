import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { App } from './App';

// Mock environment variables
vi.stubEnv('VITE_API_URL', 'http://localhost:3001');
vi.stubEnv('VITE_API_TOKEN', 'test-token');

// Mock fetch globally
global.fetch = vi.fn();

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

  describe('Mobile Navigation', () => {
    it('shows hamburger menu button on mobile', () => {
      render(<App />);
      const hamburger = screen.getByRole('button', { name: /toggle navigation/i });
      expect(hamburger).toBeInTheDocument();
    });

    it('sidebar is hidden by default on mobile (has lg:block class)', () => {
      render(<App />);
      const sidebar = screen.getByRole('complementary');

      // Should have class indicating it's hidden on small screens and visible on large
      expect(sidebar).toHaveClass('lg:block');
    });

    it('toggles sidebar visibility when hamburger is clicked', async () => {
      render(<App />);

      const hamburger = screen.getByRole('button', { name: /toggle navigation/i });
      const sidebar = screen.getByRole('complementary');

      // Initially translated off-screen on mobile
      expect(sidebar).toHaveClass('-translate-x-full');

      // Click to open
      fireEvent.click(hamburger);
      await waitFor(() => {
        expect(sidebar).toHaveClass('translate-x-0');
        expect(sidebar).not.toHaveClass('-translate-x-full');
      });

      // Click to close
      fireEvent.click(hamburger);
      await waitFor(() => {
        expect(sidebar).toHaveClass('-translate-x-full');
        expect(sidebar).not.toHaveClass('translate-x-0');
      });
    });

    it('shows backdrop when sidebar is open on mobile', async () => {
      render(<App />);

      const hamburger = screen.getByRole('button', { name: /toggle navigation/i });

      // Open sidebar
      fireEvent.click(hamburger);

      // Backdrop should be visible
      await waitFor(() => {
        const backdrop = screen.getByTestId('sidebar-backdrop');
        expect(backdrop).toBeInTheDocument();
      });
    });

    it('closes sidebar when backdrop is clicked', async () => {
      render(<App />);

      const hamburger = screen.getByRole('button', { name: /toggle navigation/i });

      // Open sidebar
      fireEvent.click(hamburger);

      // Wait for backdrop to appear
      await waitFor(() => {
        const backdrop = screen.getByTestId('sidebar-backdrop');
        expect(backdrop).toBeInTheDocument();
      });

      const backdrop = screen.getByTestId('sidebar-backdrop');

      // Click backdrop
      fireEvent.click(backdrop);

      // Sidebar should close (translated off-screen)
      const sidebar = screen.getByRole('complementary');
      await waitFor(() => {
        expect(sidebar).toHaveClass('-translate-x-full');
      });
    });

    it('hamburger button is hidden on desktop (has lg:hidden class)', () => {
      render(<App />);
      const hamburger = screen.getByRole('button', { name: /toggle navigation/i });

      expect(hamburger).toHaveClass('lg:hidden');
    });

    it('closes sidebar when a navigation link is clicked', async () => {
      render(<App />);

      const hamburger = screen.getByRole('button', { name: /toggle navigation/i });

      // Open sidebar
      fireEvent.click(hamburger);
      const sidebar = screen.getByRole('complementary');

      await waitFor(() => {
        expect(sidebar).toHaveClass('translate-x-0');
      });

      // Click a navigation link (use getAllByRole since there are multiple)
      const dataRoomsLinks = screen.getAllByRole('link', { name: /data rooms/i });
      fireEvent.click(dataRoomsLinks[0]);

      // Sidebar should close
      await waitFor(() => {
        expect(sidebar).toHaveClass('-translate-x-full');
      });
    });
  });
});
