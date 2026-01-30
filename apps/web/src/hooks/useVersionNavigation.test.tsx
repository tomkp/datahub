import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVersionNavigation } from './useVersionNavigation';

const mockVersions = [
  { id: 'v1', fileId: 'f1', storageUrl: '/v1', uploadedBy: 'user1', uploadedAt: '2024-01-01' },
  { id: 'v2', fileId: 'f1', storageUrl: '/v2', uploadedBy: 'user1', uploadedAt: '2024-01-02' },
  { id: 'v3', fileId: 'f1', storageUrl: '/v3', uploadedBy: 'user1', uploadedAt: '2024-01-03' },
];

describe('useVersionNavigation', () => {
  it('initializes with first item selected', () => {
    const { result } = renderHook(() => useVersionNavigation(mockVersions));
    expect(result.current.selectedIndex).toBe(0);
    expect(result.current.selectedVersion).toEqual(mockVersions[0]);
  });

  it('selects next version on ArrowDown', () => {
    const { result } = renderHook(() => useVersionNavigation(mockVersions));

    act(() => {
      result.current.handleKeyDown({ key: 'ArrowDown', preventDefault: vi.fn() } as any);
    });

    expect(result.current.selectedIndex).toBe(1);
  });

  it('selects previous version on ArrowUp', () => {
    const { result } = renderHook(() => useVersionNavigation(mockVersions));

    act(() => {
      result.current.handleKeyDown({ key: 'ArrowDown', preventDefault: vi.fn() } as any);
      result.current.handleKeyDown({ key: 'ArrowUp', preventDefault: vi.fn() } as any);
    });

    expect(result.current.selectedIndex).toBe(0);
  });

  it('does not go below 0 on ArrowUp', () => {
    const { result } = renderHook(() => useVersionNavigation(mockVersions));

    act(() => {
      result.current.handleKeyDown({ key: 'ArrowUp', preventDefault: vi.fn() } as any);
    });

    expect(result.current.selectedIndex).toBe(0);
  });

  it('does not go beyond last item on ArrowDown', () => {
    const { result } = renderHook(() => useVersionNavigation(mockVersions));

    act(() => {
      result.current.handleKeyDown({ key: 'ArrowDown', preventDefault: vi.fn() } as any);
      result.current.handleKeyDown({ key: 'ArrowDown', preventDefault: vi.fn() } as any);
      result.current.handleKeyDown({ key: 'ArrowDown', preventDefault: vi.fn() } as any);
    });

    expect(result.current.selectedIndex).toBe(2);
  });

  it('calls onSelect with Enter key', () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() => useVersionNavigation(mockVersions, { onSelect }));

    act(() => {
      result.current.handleKeyDown({ key: 'Enter', preventDefault: vi.fn() } as any);
    });

    expect(onSelect).toHaveBeenCalledWith(mockVersions[0]);
  });

  it('allows manual selection by index', () => {
    const { result } = renderHook(() => useVersionNavigation(mockVersions));

    act(() => {
      result.current.selectVersion(2);
    });

    expect(result.current.selectedIndex).toBe(2);
    expect(result.current.selectedVersion).toEqual(mockVersions[2]);
  });

  it('jumps to first item on Home key', () => {
    const { result } = renderHook(() => useVersionNavigation(mockVersions));

    act(() => {
      result.current.selectVersion(2);
      result.current.handleKeyDown({ key: 'Home', preventDefault: vi.fn() } as any);
    });

    expect(result.current.selectedIndex).toBe(0);
  });

  it('jumps to last item on End key', () => {
    const { result } = renderHook(() => useVersionNavigation(mockVersions));

    act(() => {
      result.current.handleKeyDown({ key: 'End', preventDefault: vi.fn() } as any);
    });

    expect(result.current.selectedIndex).toBe(2);
  });

  it('returns null for empty array', () => {
    const { result } = renderHook(() => useVersionNavigation([]));
    expect(result.current.selectedVersion).toBeNull();
    expect(result.current.selectedIndex).toBe(-1);
  });
});
