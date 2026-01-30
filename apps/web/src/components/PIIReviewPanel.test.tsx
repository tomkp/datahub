import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PIIReviewPanel } from './PIIReviewPanel';

describe('PIIReviewPanel', () => {
  const defaultProps = {
    fileId: 'file-123',
    onApprove: vi.fn(),
    onReject: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('renders approve and reject buttons', () => {
      render(<PIIReviewPanel {...defaultProps} />);
      expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
    });

    it('renders comment input', () => {
      render(<PIIReviewPanel {...defaultProps} />);
      expect(screen.getByPlaceholderText(/add a comment/i)).toBeInTheDocument();
    });
  });

  describe('approve action', () => {
    it('calls onApprove with comment when approve is clicked', () => {
      render(<PIIReviewPanel {...defaultProps} />);

      const commentInput = screen.getByPlaceholderText(/add a comment/i);
      fireEvent.change(commentInput, { target: { value: 'Reviewed and approved' } });

      const approveButton = screen.getByRole('button', { name: /approve/i });
      fireEvent.click(approveButton);

      expect(defaultProps.onApprove).toHaveBeenCalledWith('file-123', 'Reviewed and approved');
    });

    it('calls onApprove with empty comment if none provided', () => {
      render(<PIIReviewPanel {...defaultProps} />);

      const approveButton = screen.getByRole('button', { name: /approve/i });
      fireEvent.click(approveButton);

      expect(defaultProps.onApprove).toHaveBeenCalledWith('file-123', '');
    });
  });

  describe('reject action', () => {
    it('calls onReject with comment when reject is clicked', () => {
      render(<PIIReviewPanel {...defaultProps} />);

      const commentInput = screen.getByPlaceholderText(/add a comment/i);
      fireEvent.change(commentInput, { target: { value: 'Contains sensitive SSN data' } });

      const rejectButton = screen.getByRole('button', { name: /reject/i });
      fireEvent.click(rejectButton);

      expect(defaultProps.onReject).toHaveBeenCalledWith('file-123', 'Contains sensitive SSN data');
    });
  });

  describe('review status display', () => {
    it('displays approved status', () => {
      render(
        <PIIReviewPanel
          {...defaultProps}
          reviewStatus="approved"
          reviewedAt="2024-01-20T10:00:00Z"
          reviewedBy="john.doe"
          reviewComment="All clear"
        />
      );

      expect(screen.getByText(/approved/i)).toBeInTheDocument();
      expect(screen.getByText(/john.doe/i)).toBeInTheDocument();
      expect(screen.getByText(/all clear/i)).toBeInTheDocument();
    });

    it('displays rejected status', () => {
      render(
        <PIIReviewPanel
          {...defaultProps}
          reviewStatus="rejected"
          reviewedAt="2024-01-20T11:00:00Z"
          reviewedBy="jane.smith"
          reviewComment="Contains unredacted PII"
        />
      );

      expect(screen.getByText(/rejected/i)).toBeInTheDocument();
      expect(screen.getByText(/jane.smith/i)).toBeInTheDocument();
      expect(screen.getByText(/contains unredacted pii/i)).toBeInTheDocument();
    });

    it('hides action buttons when already reviewed', () => {
      render(
        <PIIReviewPanel
          {...defaultProps}
          reviewStatus="approved"
          reviewedAt="2024-01-20T10:00:00Z"
          reviewedBy="john.doe"
        />
      );

      expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('disables buttons when submitting', () => {
      render(<PIIReviewPanel {...defaultProps} isSubmitting />);

      expect(screen.getByRole('button', { name: /approve/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /reject/i })).toBeDisabled();
    });
  });

  describe('accessibility', () => {
    it('has accessible form structure', () => {
      render(<PIIReviewPanel {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/add a comment/i);
      expect(textarea).toHaveAttribute('aria-label');
    });
  });
});
