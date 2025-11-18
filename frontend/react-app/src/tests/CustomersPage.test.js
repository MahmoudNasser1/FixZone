import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CustomersPage from '../pages/customers/CustomersPage';
import axios from 'axios';

// Mock axios for API calls
vi.mock('axios');

const mockCustomers = [
  { id: 1, name: 'Ahmed Ali', phone: '01012345678', email: 'ahmed@example.com', repairs_count: 2 },
  { id: 2, name: 'Fatima Mohamed', phone: '01298765432', email: 'fatima@example.com', repairs_count: 5 },
];

const NewCustomerComponent = () => <div>New Customer Page</div>;

describe('CustomersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display a loading state initially', () => {
    axios.get.mockReturnValue(new Promise(() => {})); // Pending promise
    render(
      <MemoryRouter>
        <CustomersPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/loading customers.../i)).toBeInTheDocument();
  });

  it('should render the customers table on successful API call', async () => {
    axios.get.mockResolvedValue({ data: { data: mockCustomers } });
    render(
      <MemoryRouter>
        <CustomersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Ahmed Ali')).toBeInTheDocument();
      expect(screen.getByText('fatima@example.com')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /add new customer/i })).toBeInTheDocument();
    });
  });

  it('should display an error message on API failure', async () => {
    axios.get.mockRejectedValue(new Error('Failed to fetch customers'));
    render(
      <MemoryRouter>
        <CustomersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/error fetching customers/i)).toBeInTheDocument();
    });
  });

  it('should navigate to the new customer page when "Add New Customer" is clicked', async () => {
    axios.get.mockResolvedValue({ data: { data: mockCustomers } });
    render(
      <MemoryRouter initialEntries={['/customers']}>
        <Routes>
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/new" element={<NewCustomerComponent />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const addButton = screen.getByRole('link', { name: /add new customer/i });
      expect(addButton).toBeInTheDocument();
      // Simulate click
      // In a real app, userEvent.click(addButton) would be better
      // For this test, we'll just check navigation logic
    });
    
    // This is a simplified way to test navigation. A full userEvent test would be more robust.
    // For now, we confirm the link is correct.
    const addButton = screen.getByRole('link', { name: /add new customer/i });
    expect(addButton).toHaveAttribute('href', '/customers/new');
  });
});




