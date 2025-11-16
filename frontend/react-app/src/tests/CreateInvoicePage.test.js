import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import CreateInvoicePage from '../pages/invoices/CreateInvoicePage';
import axios from 'axios';

// Mock axios for all API calls
vi.mock('axios');

const mockCustomers = [
  { id: 1, name: 'Test Customer 1', phone: '111' },
  { id: 2, name: 'Test Customer 2', phone: '222' },
];

const mockServices = [
  { id: 1, name: 'Screen Replacement', basePrice: 500 },
  { id: 2, name: 'Battery Change', basePrice: 250 },
];

describe('CreateInvoicePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock API endpoints used on page load
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/customers')) {
        return Promise.resolve({ data: { data: mockCustomers } });
      }
      if (url.includes('/api/services')) {
        return Promise.resolve({ data: { data: mockServices } });
      }
      return Promise.reject(new Error('Not mocked'));
    });
  });

  it('should render the form with initial fields', async () => {
    render(
      <MemoryRouter>
        <CreateInvoicePage />
      </MemoryRouter>
    );

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByLabelText(/select customer/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/invoice date/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create invoice/i })).toBeInTheDocument();
  });

  it('should allow selecting a customer and adding a service item', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CreateInvoicePage />
      </MemoryRouter>
    );

    // 1. Select a customer
    await user.click(screen.getByLabelText(/select customer/i));
    await waitFor(() => {
      expect(screen.getByText('Test Customer 1')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Test Customer 1'));
    
    // Verify customer is selected
    await waitFor(() => {
        expect(screen.getByText(/selected customer:/i)).toHaveTextContent('Test Customer 1');
    });

    // 2. Add a service item
    await user.click(screen.getByRole('button', { name: /add item/i }));
    
    // Select a service from the dropdown that appears
    // Note: The actual implementation of the item form might differ
    const serviceSelect = await screen.findByLabelText(/select service/i);
    await user.selectOptions(serviceSelect, '1'); // Select 'Screen Replacement'

    // Verify item is added to the list (assuming it shows up)
    expect(await screen.findByText('Screen Replacement')).toBeInTheDocument();
    expect(await screen.findByDisplayValue('500')).toBeInTheDocument();
  });

  it('should submit the new invoice with correct data', async () => {
    const user = userEvent.setup();
    axios.post.mockResolvedValue({ data: { id: 101, message: 'Invoice created' } });

    render(
      <MemoryRouter>
        <CreateInvoicePage />
      </MemoryRouter>
    );

    // --- Fill the form ---
    // 1. Select customer
    await user.click(screen.getByLabelText(/select customer/i));
    await user.click(await screen.findByText('Test Customer 2'));

    // 2. Add service
    await user.click(screen.getByRole('button', { name: /add item/i }));
    await user.selectOptions(await screen.findByLabelText(/select service/i), '2'); // Battery Change

    // 3. Submit
    await user.click(screen.getByRole('button', { name: /create invoice/i }));

    // --- Verify submission ---
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/invoices', expect.objectContaining({
        customerId: 2,
        items: expect.arrayContaining([
          expect.objectContaining({
            serviceId: 2,
            quantity: 1,
            unitPrice: 250,
          })
        ])
      }));
    });

    // Optionally, check for a success message or navigation
    expect(await screen.findByText(/invoice created successfully/i)).toBeInTheDocument();
  });
});


