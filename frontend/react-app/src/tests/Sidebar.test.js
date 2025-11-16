import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Sidebar from '../components/layout/Sidebar';
import useUIStore from '../stores/uiStore';

// Mock the UI store
vi.mock('../stores/uiStore');

describe('Sidebar Component', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    // Provide a default mock implementation for the store
    useUIStore.mockReturnValue({
      isSidebarOpen: true,
      toggleSidebar: vi.fn(),
    });
  });

  it('should render navigation links correctly', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /repairs/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /invoices/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /inventory/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /customers/i })).toBeInTheDocument();
  });

  it('should be visible when isSidebarOpen is true', () => {
    useUIStore.mockReturnValue({ isSidebarOpen: true, toggleSidebar: vi.fn() });
    const { container } = render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    // This test is implementation-specific. We assume visibility is controlled
    // by a class or data attribute. Let's check for a common pattern.
    expect(container.firstChild).not.toHaveClass('-translate-x-full');
  });

  it('should be hidden when isSidebarOpen is false', () => {
    useUIStore.mockReturnValue({ isSidebarOpen: false, toggleSidebar: vi.fn() });
    const { container } = render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    // Check for a class that would hide the element off-screen
    expect(container.firstChild).toHaveClass('-translate-x-full');
  });

  // This test assumes there's a button inside the Sidebar to close it.
  // If the toggle is outside, this test should be in the parent component (e.g., MainLayout).
  it('should call toggleSidebar when the close button is clicked', async () => {
    const toggleSidebarMock = vi.fn();
    useUIStore.mockReturnValue({ isSidebarOpen: true, toggleSidebar: toggleSidebarMock });
    
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    const closeButton = screen.getByRole('button', { name: /close sidebar/i }); // Assuming it has an accessible name
    await userEvent.click(closeButton);

    expect(toggleSidebarMock).toHaveBeenCalledTimes(1);
  });
});


