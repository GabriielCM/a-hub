import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/input';

describe('Input', () => {
  it('should render with default props', () => {
    render(<Input placeholder="Enter text" />);

    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('flex', 'h-10', 'w-full', 'rounded-md');
  });

  it('should render with text type by default', () => {
    render(<Input data-testid="input" />);

    const input = screen.getByTestId('input');
    expect(input).not.toHaveAttribute('type'); // No explicit type means text
  });

  it('should render with password type', () => {
    render(<Input type="password" data-testid="password-input" />);

    const input = screen.getByTestId('password-input');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('should render with email type', () => {
    render(<Input type="email" data-testid="email-input" />);

    const input = screen.getByTestId('email-input');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('should render with number type', () => {
    render(<Input type="number" data-testid="number-input" />);

    const input = screen.getByTestId('number-input');
    expect(input).toHaveAttribute('type', 'number');
  });

  it('should handle user input', async () => {
    const user = userEvent.setup();
    render(<Input data-testid="input" />);

    const input = screen.getByTestId('input');
    await user.type(input, 'Hello World');

    expect(input).toHaveValue('Hello World');
  });

  it('should handle onChange events', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();

    render(<Input onChange={handleChange} data-testid="input" />);

    const input = screen.getByTestId('input');
    await user.type(input, 'test');

    expect(handleChange).toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled data-testid="input" />);

    const input = screen.getByTestId('input');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
  });

  it('should merge custom className', () => {
    render(<Input className="custom-class" data-testid="input" />);

    const input = screen.getByTestId('input');
    expect(input).toHaveClass('custom-class');
    expect(input).toHaveClass('flex', 'h-10'); // Still has default styles
  });

  it('should forward ref correctly', () => {
    const ref = jest.fn();
    render(<Input ref={ref} data-testid="input" />);

    expect(ref).toHaveBeenCalled();
    expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLInputElement);
  });

  it('should accept value prop', () => {
    render(<Input value="test value" onChange={() => {}} data-testid="input" />);

    const input = screen.getByTestId('input');
    expect(input).toHaveValue('test value');
  });

  it('should render with placeholder', () => {
    render(<Input placeholder="Enter your name" />);

    const input = screen.getByPlaceholderText('Enter your name');
    expect(input).toBeInTheDocument();
  });
});
