import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDocumentTitle } from './useDocumentTitle';

describe('useDocumentTitle', () => {
  const originalTitle = document.title;

  beforeEach(() => {
    document.title = 'DataHub';
  });

  afterEach(() => {
    document.title = originalTitle;
  });

  it('sets document title with app name suffix', () => {
    renderHook(() => useDocumentTitle('Test Page'));
    expect(document.title).toBe('Test Page - DataHub');
  });

  it('sets just app name when title is empty', () => {
    renderHook(() => useDocumentTitle(''));
    expect(document.title).toBe('DataHub');
  });

  it('sets just app name when title is undefined', () => {
    renderHook(() => useDocumentTitle(undefined));
    expect(document.title).toBe('DataHub');
  });

  it('updates title when title changes', () => {
    const { rerender } = renderHook(({ title }) => useDocumentTitle(title), {
      initialProps: { title: 'Page 1' },
    });
    expect(document.title).toBe('Page 1 - DataHub');

    rerender({ title: 'Page 2' });
    expect(document.title).toBe('Page 2 - DataHub');
  });

  it('restores original title on unmount', () => {
    document.title = 'Original Title';
    const { unmount } = renderHook(() => useDocumentTitle('Test Page'));
    expect(document.title).toBe('Test Page - DataHub');

    unmount();
    expect(document.title).toBe('Original Title');
  });
});
