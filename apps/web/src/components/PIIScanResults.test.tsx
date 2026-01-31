import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PIIScanResults } from './PIIScanResults';

const mockPIIResults = {
  status: 'completed' as const,
  piiTypes: [
    {
      type: 'EMAIL',
      confidence: 0.95,
      count: 15,
      samples: [
        { value: 'john.doe@example.com', location: 'Column A, Row 5' },
        { value: 'jane.smith@test.org', location: 'Column A, Row 12' },
        { value: 'admin@company.net', location: 'Column A, Row 23' },
      ],
    },
    {
      type: 'PHONE_NUMBER',
      confidence: 0.88,
      count: 8,
      samples: [
        { value: '+1-555-123-4567', location: 'Column B, Row 3' },
        { value: '(555) 987-6543', location: 'Column B, Row 15' },
      ],
    },
    {
      type: 'SSN',
      confidence: 0.92,
      count: 3,
      samples: [
        { value: '***-**-1234', location: 'Column C, Row 7' },
      ],
    },
  ],
};

const mockUnsupportedResult = {
  status: 'unsupported' as const,
  reason: 'Binary file format does not support PII scanning',
};

const mockPendingResult = {
  status: 'pending' as const,
};

const mockNoResultsFound = {
  status: 'completed' as const,
  piiTypes: [],
};

describe('PIIScanResults', () => {
  describe('completed scan with results', () => {
    it('renders all PII types', () => {
      render(<PIIScanResults results={mockPIIResults} />);
      expect(screen.getByText('EMAIL')).toBeInTheDocument();
      expect(screen.getByText('PHONE_NUMBER')).toBeInTheDocument();
      expect(screen.getByText('SSN')).toBeInTheDocument();
    });

    it('displays confidence scores', () => {
      render(<PIIScanResults results={mockPIIResults} />);
      expect(screen.getByText('95%')).toBeInTheDocument();
      expect(screen.getByText('88%')).toBeInTheDocument();
      expect(screen.getByText('92%')).toBeInTheDocument();
    });

    it('displays occurrence counts', () => {
      render(<PIIScanResults results={mockPIIResults} />);
      expect(screen.getByText(/15 occurrences/i)).toBeInTheDocument();
      expect(screen.getByText(/8 occurrences/i)).toBeInTheDocument();
      expect(screen.getByText(/3 occurrences/i)).toBeInTheDocument();
    });

    it('shows samples when expanding a PII type', () => {
      render(<PIIScanResults results={mockPIIResults} />);

      // Initially samples should not be visible
      expect(screen.queryByText('john.doe@example.com')).not.toBeInTheDocument();

      // Click to expand EMAIL section
      const emailSection = screen.getByText('EMAIL').closest('button');
      fireEvent.click(emailSection!);

      // Now samples should be visible
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('jane.smith@test.org')).toBeInTheDocument();
      expect(screen.getByText('admin@company.net')).toBeInTheDocument();
    });

    it('shows location information for samples', () => {
      render(<PIIScanResults results={mockPIIResults} />);

      // Expand EMAIL section
      const emailSection = screen.getByText('EMAIL').closest('button');
      fireEvent.click(emailSection!);

      expect(screen.getByText('Column A, Row 5')).toBeInTheDocument();
      expect(screen.getByText('Column A, Row 12')).toBeInTheDocument();
    });

    it('collapses section when clicked again', () => {
      render(<PIIScanResults results={mockPIIResults} />);

      // Expand
      const emailSection = screen.getByText('EMAIL').closest('button');
      fireEvent.click(emailSection!);
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();

      // Collapse
      fireEvent.click(emailSection!);
      expect(screen.queryByText('john.doe@example.com')).not.toBeInTheDocument();
    });

    it('allows multiple sections to be expanded', () => {
      render(<PIIScanResults results={mockPIIResults} />);

      // Expand EMAIL
      const emailSection = screen.getByText('EMAIL').closest('button');
      fireEvent.click(emailSection!);

      // Expand PHONE_NUMBER
      const phoneSection = screen.getByText('PHONE_NUMBER').closest('button');
      fireEvent.click(phoneSection!);

      // Both should show samples
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('+1-555-123-4567')).toBeInTheDocument();
    });
  });

  describe('completed scan with no results', () => {
    it('displays no PII found message', () => {
      render(<PIIScanResults results={mockNoResultsFound} />);
      expect(screen.getByText(/no pii detected/i)).toBeInTheDocument();
    });
  });

  describe('unsupported file format', () => {
    it('displays unsupported message', () => {
      render(<PIIScanResults results={mockUnsupportedResult} />);
      expect(screen.getByText(/pii scanning not supported/i)).toBeInTheDocument();
    });

    it('shows the reason for unsupported status', () => {
      render(<PIIScanResults results={mockUnsupportedResult} />);
      expect(screen.getByText(/binary file format/i)).toBeInTheDocument();
    });
  });

  describe('pending scan', () => {
    it('displays pending message', () => {
      render(<PIIScanResults results={mockPendingResult} />);
      expect(screen.getByText(/pii scan pending/i)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has accessible accordion structure', () => {
      render(<PIIScanResults results={mockPIIResults} />);

      const emailButton = screen.getByText('EMAIL').closest('button');
      expect(emailButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(emailButton!);
      expect(emailButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('has list role for samples', () => {
      render(<PIIScanResults results={mockPIIResults} />);

      const emailSection = screen.getByText('EMAIL').closest('button');
      fireEvent.click(emailSection!);

      expect(screen.getByRole('list')).toBeInTheDocument();
    });
  });

});
