import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Toast, ToastProvider, useToast } from './Toast';

// Test component to access the hook
function TestComponent() {
  const { addToast, toasts } = useToast();
  return (
    <div>
      <button onClick={() => addToast({ type: 'success', message: 'Success!' })}>
        Add Success
      </button>
      <button onClick={() => addToast({ type: 'error', message: 'Error!' })}>
        Add Error
      </button>
      <button onClick={() => addToast({ type: 'info', message: 'Info!' })}>
        Add Info
      </button>
      <div data-testid="toast-count">{toasts.length}</div>
    </div>
  );
}

describe('Toast', () => {
  it('renders success toast with correct styling', () => {
    render(
      <Toast
        id="1"
        type="success"
        message="Operation successful"
        onDismiss={() => {}}
      />
    );
    expect(screen.getByText('Operation successful')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('bg-success');
  });

  it('renders error toast with correct styling', () => {
    render(
      <Toast
        id="2"
        type="error"
        message="Something went wrong"
        onDismiss={() => {}}
      />
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('bg-error');
  });

  it('renders info toast with correct styling', () => {
    render(
      <Toast
        id="3"
        type="info"
        message="FYI information"
        onDismiss={() => {}}
      />
    );
    expect(screen.getByText('FYI information')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('bg-info');
  });

  it('calls onDismiss when close button is clicked', () => {
    const onDismiss = vi.fn();
    render(
      <Toast
        id="4"
        type="success"
        message="Test"
        onDismiss={onDismiss}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledWith('4');
  });

  it('has accessible ARIA attributes', () => {
    render(
      <Toast
        id="5"
        type="error"
        message="Error message"
        onDismiss={() => {}}
      />
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });
});

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('provides toast context to children', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
  });

  it('adds success toast when addToast is called', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Add Success'));
    });

    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('adds error toast when addToast is called', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Add Error'));
    });

    expect(screen.getByText('Error!')).toBeInTheDocument();
  });

  it('auto-dismisses toast after timeout', () => {
    render(
      <ToastProvider autoHideDuration={5000}>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Add Success'));
    });
    expect(screen.getByText('Success!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText('Success!')).not.toBeInTheDocument();
  });

  it('stacks multiple toasts', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Add Success'));
      fireEvent.click(screen.getByText('Add Error'));
    });

    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Error!')).toBeInTheDocument();
  });

  it('removes toast when dismissed manually', () => {
    render(
      <ToastProvider autoHideDuration={0}>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Add Success'));
    });

    expect(screen.getByText('Success!')).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    });

    expect(screen.queryByText('Success!')).not.toBeInTheDocument();
  });

  it('throws error when useToast is used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow(
      'useToast must be used within a ToastProvider'
    );

    consoleError.mockRestore();
  });
});
