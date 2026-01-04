import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';

describe('Badge', () => {
  it('should render with default props', () => {
    render(<Badge>Default</Badge>);

    const badge = screen.getByText('Default');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-full');
    expect(badge).toHaveClass('bg-primary', 'text-primary-foreground');
  });

  it('should render with secondary variant', () => {
    render(<Badge variant="secondary">Secondary</Badge>);

    const badge = screen.getByText('Secondary');
    expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground');
  });

  it('should render with destructive variant', () => {
    render(<Badge variant="destructive">Destructive</Badge>);

    const badge = screen.getByText('Destructive');
    expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground');
  });

  it('should render with outline variant', () => {
    render(<Badge variant="outline">Outline</Badge>);

    const badge = screen.getByText('Outline');
    expect(badge).toHaveClass('text-foreground');
    expect(badge).not.toHaveClass('bg-primary');
  });

  it('should merge custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>);

    const badge = screen.getByText('Custom');
    expect(badge).toHaveClass('custom-class');
    expect(badge).toHaveClass('inline-flex'); // Still has default styles
  });

  it('should render children correctly', () => {
    render(
      <Badge>
        <span>Icon</span>
        <span>Text</span>
      </Badge>
    );

    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
  });

  it('should have correct base styles', () => {
    render(<Badge data-testid="badge">Test</Badge>);

    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('border', 'px-2.5', 'py-0.5', 'text-xs', 'font-semibold');
  });

  it('should pass through additional props', () => {
    render(<Badge data-testid="badge" aria-label="Status badge">Active</Badge>);

    const badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('aria-label', 'Status badge');
  });
});
