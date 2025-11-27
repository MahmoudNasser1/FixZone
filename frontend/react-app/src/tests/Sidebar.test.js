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

  it('should show expanded branding when open', () => {
    useUIStore.mockReturnValue({ isSidebarOpen: true, toggleSidebar: vi.fn() });
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    expect(screen.getByText('FixZone')).toBeInTheDocument();
  });

  it('should hide extended labels when collapsed', () => {
    useUIStore.mockReturnValue({ isSidebarOpen: false, toggleSidebar: vi.fn() });
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    expect(screen.queryByText('FixZone')).not.toBeInTheDocument();
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











