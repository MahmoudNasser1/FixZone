import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useUIStore from '../stores/uiStore';

describe('useUIStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    act(() => {
      useUIStore.setState({ isSidebarOpen: true });
    });
  });

  it('should have the correct initial state', () => {
    const { result } = renderHook(() => useUIStore());
    expect(result.current.isSidebarOpen).toBe(true);
  });

  it('should toggle the sidebar state when toggleSidebar is called', () => {
    const { result } = renderHook(() => useUIStore());

    // Toggle from true to false
    act(() => {
      result.current.toggleSidebar();
    });
    expect(result.current.isSidebarOpen).toBe(false);

    // Toggle from false to true
    act(() => {
      result.current.toggleSidebar();
    });
    expect(result.current.isSidebarOpen).toBe(true);
  });
});





