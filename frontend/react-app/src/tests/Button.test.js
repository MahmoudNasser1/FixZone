import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../components/ui/Button'; // Assuming Button is a named export

describe('Button Component', () => {
  it('should render with the correct children', () => {
    render(<Button>Click Me</Button>);
    const buttonElement = screen.getByRole('button', { name: /click me/i });
    expect(buttonElement).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={handleClick}>Clickable</Button>);
    const buttonElement = screen.getByText(/clickable/i);
    await user.click(buttonElement);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when the disabled prop is true', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={handleClick} disabled>Disabled</Button>);
    const buttonElement = screen.getByText(/disabled/i);
    expect(buttonElement).toBeDisabled();
    await user.click(buttonElement);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply the correct variant classes', () => {
    render(<Button variant="destructive">Destructive</Button>);
    const buttonElement = screen.getByRole('button', { name: /destructive/i });
    expect(buttonElement).toHaveClass('destructive');
  });

  it('should render as a different element when "asChild" is true', () => {
    render(
      <Button asChild>
        <a href="/">Link Button</a>
      </Button>
    );
    // It should render an anchor tag, not a button
    const linkElement = screen.getByRole('link', { name: /link button/i });
    expect(linkElement).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});











