import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../components/ui/Button'; // Assuming Button is a named export

describe('Button Component', () => {
  it('should render with the correct children', () => {
    render(<Button>Click Me</Button>);
    const buttonElement = screen.getByRole('button', { name: /click me/i });
    expect(buttonElement).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Clickable</Button>);
    const buttonElement = screen.getByText(/clickable/i);
    fireEvent.click(buttonElement);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when the disabled prop is true', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Disabled</Button>);
    const buttonElement = screen.getByText(/disabled/i);
    expect(buttonElement).toBeDisabled();
    fireEvent.click(buttonElement);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply the correct variant classes', () => {
    const { container } = render(<Button variant="destructive">Destructive</Button>);
    // This is a snapshot-like test for className, assuming cva creates predictable classes
    expect(container.firstChild.className).toContain('destructive');
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









