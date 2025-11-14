import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import useAuthStore from '../stores/authStore';

// Mock dependencies
jest.mock('../stores/authStore');
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => jest.fn(),
  };
});

describe('LoginPage - UI Component Tests', () => {
  const mockLogin = jest.fn();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.mockReturnValue({
      login: mockLogin,
      isAuthenticated: false,
      user: null,
    });
  });

  describe('Rendering Tests', () => {
    it('should render all UI elements correctly', () => {
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      // Check for main elements
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText(/enter your credentials/i)).toBeInTheDocument();
      
      // Check for form inputs
      expect(screen.getByLabelText(/email or phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      
      // Check for buttons and links
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByText(/remember me/i)).toBeInTheDocument();
      expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    });

    it('should have correct input types and attributes', () => {
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      const emailInput = screen.getByLabelText(/email or phone/i);
      const passwordInput = screen.getByLabelText(/^password$/i);

      expect(emailInput).toHaveAttribute('type', 'text');
      expect(emailInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('placeholder', 'e.g., user@example.com or 0123456789');

      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('required');
    });
  });

  describe('User Interaction Tests', () => {
    it('should update input values when user types', async () => {
      const user = userEvent.setup();
      
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      const emailInput = screen.getByLabelText(/email or phone/i);
      const passwordInput = screen.getByLabelText(/^password$/i);

      // Type in email field
      await user.type(emailInput, 'test@example.com');
      expect(emailInput).toHaveValue('test@example.com');

      // Type in password field
      await user.type(passwordInput, 'password123');
      expect(passwordInput).toHaveValue('password123');
    });

    it('should clear previous input when user types new value', async () => {
      const user = userEvent.setup();
      
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      const emailInput = screen.getByLabelText(/email or phone/i);
      
      await user.type(emailInput, 'old@example.com');
      expect(emailInput).toHaveValue('old@example.com');
      
      await user.clear(emailInput);
      await user.type(emailInput, 'new@example.com');
      expect(emailInput).toHaveValue('new@example.com');
    });

    it('should toggle remember me checkbox', async () => {
      const user = userEvent.setup();
      
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      const rememberCheckbox = screen.getByRole('checkbox', { name: /remember me/i });
      
      expect(rememberCheckbox).not.toBeChecked();
      await user.click(rememberCheckbox);
      expect(rememberCheckbox).toBeChecked();
      await user.click(rememberCheckbox);
      expect(rememberCheckbox).not.toBeChecked();
    });
  });

  describe('Form Submission Tests', () => {
    it('should call login function with correct credentials on form submit', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue(true);
      
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      const emailInput = screen.getByLabelText(/email or phone/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'admin@fixzone.com');
      await user.type(passwordInput, 'securePassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('admin@fixzone.com', 'securePassword123');
      });
    });

    it('should prevent submission if required fields are empty', async () => {
      const user = userEvent.setup();
      
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      // Try to submit without filling fields
      await user.click(submitButton);

      // HTML5 validation should prevent submission
      // The login function should not be called
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should show loading state during login', async () => {
      const user = userEvent.setup();
      // Create a promise that we can control
      let resolveLogin;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });
      mockLogin.mockReturnValue(loginPromise);
      
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      const emailInput = screen.getByLabelText(/email or phone/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password');
      await user.click(submitButton);

      // Check for loading state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });

      // Resolve the login promise
      resolveLogin(true);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Tests', () => {
    it('should display error message when login fails', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Invalid credentials';
      mockLogin.mockRejectedValue(new Error(errorMessage));
      
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      const emailInput = screen.getByLabelText(/email or phone/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/error:/i)).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should clear error message when user starts typing again', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValue(new Error('Login failed'));
      
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      const emailInput = screen.getByLabelText(/email or phone/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Trigger error
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/error:/i)).toBeInTheDocument();
      });

      // Start typing again - error should clear
      await user.type(emailInput, 'x');
      
      await waitFor(() => {
        expect(screen.queryByText(/error:/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Tests', () => {
    it('should have proper label associations for inputs', () => {
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      const emailInput = screen.getByLabelText(/email or phone/i);
      const passwordInput = screen.getByLabelText(/^password$/i);

      // Check that inputs are properly associated with their labels
      expect(emailInput).toHaveAttribute('id', 'loginIdentifier');
      expect(passwordInput).toHaveAttribute('id', 'password');
    });

    it('should disable inputs during loading state', async () => {
      const user = userEvent.setup();
      let resolveLogin;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });
      mockLogin.mockReturnValue(loginPromise);
      
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      const emailInput = screen.getByLabelText(/email or phone/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password');
      await user.click(submitButton);

      await waitFor(() => {
        expect(emailInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
        expect(submitButton).toBeDisabled();
      });

      resolveLogin(true);
    });
  });
});

