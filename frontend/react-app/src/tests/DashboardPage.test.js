import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
import axios from 'axios';

// Mock axios to control API responses
vi.mock('axios');

const mockDashboardData = {
  stats: {
    totalRevenue: 15000,
    newRepairs: 12,
    completedRepairs: 8,
    pendingInvoices: 5,
  },
  recentActivity: [
    { id: 1, type: 'REPAIR_CREATED', description: 'New repair for iPhone 12 screen', createdAt: new Date().toISOString() },
    { id: 2, type: 'INVOICE_PAID', description: 'Invoice #1024 paid', createdAt: new Date().toISOString() },
  ],
  performanceMetrics: {
    averageRepairTime: '3 days',
    customerSatisfaction: '95%',
  }
};

describe('DashboardPage', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it('should display loading state initially', () => {
    // Mock a pending promise
    axios.get.mockReturnValue(new Promise(() => { }));

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    // Expect to see multiple skeleton loaders
    expect(screen.getAllByTestId('skeleton-loader').length).toBeGreaterThan(0);
  });

  it('should render dashboard data after successful API call', async () => {
    axios.get.mockResolvedValue({ data: mockDashboardData });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    const totalRevenueHeading = await screen.findByText(/total revenue/i);
    expect(totalRevenueHeading).toBeInTheDocument();
    expect(await screen.findByText('EGP 15,000')).toBeInTheDocument();
    expect(await screen.findByText(/new repairs/i)).toBeInTheDocument();
    expect(await screen.findByText('12')).toBeInTheDocument();
    expect(await screen.findByText(/recent activity/i)).toBeInTheDocument();
    expect(await screen.findByText('New repair for iPhone 12 screen')).toBeInTheDocument();
    expect(await screen.findByText('Invoice #1024 paid')).toBeInTheDocument();
  });

  it('should display an error message on API failure', async () => {
    const errorMessage = 'Failed to fetch dashboard data';
    axios.get.mockRejectedValue(new Error(errorMessage));

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/error/i)).toBeInTheDocument();
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
  });
});











