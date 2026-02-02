import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render button with children text', () => {
      render(<Button>Click me</Button>);
      
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('should render with default props when no props provided', () => {
      render(<Button>Default Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
      expect(button).not.toBeDisabled();
    });

    it('should render children as ReactNode', () => {
      render(
        <Button>
          <span data-testid="icon">🚀</span>
          <span>Launch</span>
        </Button>
      );
      
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('Launch')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render primary variant with correct styles', () => {
      render(<Button variant="primary">Primary</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-to-r', 'from-primary-600', 'to-indigo-600');
    });

    it('should render secondary variant with correct styles', () => {
      render(<Button variant="secondary">Secondary</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-dark-card', 'hover:bg-dark-border');
    });

    it('should render outline variant with correct styles', () => {
      render(<Button variant="outline">Outline</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border', 'border-dark-border');
    });

    it('should render ghost variant with correct styles', () => {
      render(<Button variant="ghost">Ghost</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-white/5');
    });

    it('should render danger variant with correct styles', () => {
      render(<Button variant="danger">Danger</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-to-r', 'from-red-600', 'to-rose-600');
    });

    it('should render glow variant with correct styles', () => {
      render(<Button variant="glow">Glow</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-dark-bg', 'border-primary-500/50');
    });

    it('should render glass variant with correct styles', () => {
      render(<Button variant="glass">Glass</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white/10', 'backdrop-blur-md');
    });
  });

  describe('Sizes', () => {
    it('should render small size with correct styles', () => {
      render(<Button size="sm">Small</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-xs');
    });

    it('should render medium size with correct styles (default)', () => {
      render(<Button size="md">Medium</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-5', 'py-2.5', 'text-sm');
    });

    it('should render large size with correct styles', () => {
      render(<Button size="lg">Large</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-8', 'py-3.5', 'text-base');
    });
  });

  describe('Button Types', () => {
    it('should render as button type by default', () => {
      render(<Button>Button</Button>);
      
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('should render as submit type when specified', () => {
      render(<Button type="submit">Submit</Button>);
      
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('should render as reset type when specified', () => {
      render(<Button type="reset">Reset</Button>);
      
      expect(screen.getByRole('button')).toHaveAttribute('type', 'reset');
    });
  });

  describe('Full Width', () => {
    it('should render full width when fullWidth prop is true', () => {
      render(<Button fullWidth>Full Width</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });

    it('should not render full width by default', () => {
      render(<Button>Normal Width</Button>);
      
      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('w-full');
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className alongside default classes', () => {
      render(<Button className="custom-class">Custom</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
      expect(button).toHaveClass('inline-flex'); // Should still have base classes
    });

    it('should merge multiple custom classes', () => {
      render(<Button className="custom-1 custom-2">Multiple Classes</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-1', 'custom-2');
    });
  });

  describe('Click Handling', () => {
    it('should call onClick handler when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Click Me</Button>);
      
      await user.click(screen.getByRole('button'));
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick multiple times for multiple clicks', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Click Me</Button>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      await user.click(button);
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('should work without onClick handler', async () => {
      const user = userEvent.setup();
      
      render(<Button>No Handler</Button>);
      
      // Should not throw error
      await expect(user.click(screen.getByRole('button'))).resolves.not.toThrow();
    });
  });

  describe('Disabled State', () => {
    it('should render as disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should not call onClick when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      
      await user.click(screen.getByRole('button'));
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should apply disabled opacity styles', () => {
      render(<Button disabled>Disabled</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });

    it('should be enabled by default', () => {
      render(<Button>Enabled</Button>);
      
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });

  describe('Loading State', () => {
    it('should render loading spinner when loading is true', () => {
      render(<Button loading>Loading</Button>);
      
      const button = screen.getByRole('button');
      const spinner = button.querySelector('svg');
      
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('w-4', 'h-4');
    });

    it('should disable button when loading', () => {
      render(<Button loading>Loading</Button>);
      
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should not call onClick when loading', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button loading onClick={handleClick}>Loading</Button>);
      
      await user.click(screen.getByRole('button'));
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should show both spinner and children text when loading', () => {
      render(<Button loading>Submitting</Button>);
      
      const button = screen.getByRole('button');
      expect(button.querySelector('svg')).toBeInTheDocument();
      expect(screen.getByText('Submitting')).toBeInTheDocument();
    });

    it('should not show spinner when not loading', () => {
      render(<Button loading={false}>Not Loading</Button>);
      
      const button = screen.getByRole('button');
      expect(button.querySelector('svg')).not.toBeInTheDocument();
    });
  });

  describe('Combined States', () => {
    it('should handle both disabled and loading states together', () => {
      render(<Button disabled loading>Disabled & Loading</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('should not call onClick when both disabled and loading', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(
        <Button disabled loading onClick={handleClick}>
          Disabled & Loading
        </Button>
      );
      
      await user.click(screen.getByRole('button'));
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Primary Variant Shimmer Effect', () => {
    it('should render shimmer effect div for primary variant', () => {
      const { container } = render(<Button variant="primary">Primary</Button>);
      
      const shimmer = container.querySelector('.bg-gradient-to-r.from-transparent');
      expect(shimmer).toBeInTheDocument();
    });

    it('should not render shimmer effect for non-primary variants', () => {
      const { container } = render(<Button variant="secondary">Secondary</Button>);
      
      const shimmer = container.querySelector('.bg-gradient-to-r.from-transparent');
      expect(shimmer).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Accessible</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      expect(button).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should have focus ring styles', () => {
      render(<Button>Focus Ring</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
    });

    it('should maintain semantic button role', () => {
      render(<Button>Semantic Button</Button>);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children gracefully', () => {
      render(<Button>{''}</Button>);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle null onClick gracefully', () => {
      render(<Button onClick={undefined}>No Handler</Button>);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle all props together', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(
        <Button
          variant="danger"
          size="lg"
          type="submit"
          fullWidth
          className="custom-class"
          onClick={handleClick}
        >
          Complex Button
        </Button>
      );
      
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveClass('w-full', 'custom-class', 'px-8', 'py-3.5');
      
      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid clicks correctly', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Rapid Click</Button>);
      
      const button = screen.getByRole('button');
      
      // Simulate rapid clicks
      await user.tripleClick(button);
      
      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });
});
