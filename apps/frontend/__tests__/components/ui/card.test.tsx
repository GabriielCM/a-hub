import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

describe('Card Components', () => {
  describe('Card', () => {
    it('should render with default props', () => {
      render(<Card data-testid="card">Card content</Card>);

      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent('Card content');
      expect(card).toHaveClass('rounded-lg', 'border', 'bg-card', 'shadow-sm');
    });

    it('should merge custom className', () => {
      render(<Card className="custom-class" data-testid="card">Content</Card>);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('rounded-lg'); // Still has default styles
    });

    it('should forward ref correctly', () => {
      const ref = jest.fn();
      render(<Card ref={ref}>Content</Card>);

      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardHeader', () => {
    it('should render with default props', () => {
      render(<CardHeader data-testid="header">Header</CardHeader>);

      const header = screen.getByTestId('header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
    });

    it('should merge custom className', () => {
      render(<CardHeader className="custom-header" data-testid="header">Header</CardHeader>);

      const header = screen.getByTestId('header');
      expect(header).toHaveClass('custom-header');
    });

    it('should forward ref correctly', () => {
      const ref = jest.fn();
      render(<CardHeader ref={ref}>Header</CardHeader>);

      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardTitle', () => {
    it('should render with default props', () => {
      render(<CardTitle>Title</CardTitle>);

      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Title');
      expect(title).toHaveClass('text-2xl', 'font-semibold');
    });

    it('should merge custom className', () => {
      render(<CardTitle className="custom-title" data-testid="title">Title</CardTitle>);

      const title = screen.getByTestId('title');
      expect(title).toHaveClass('custom-title');
    });

    it('should forward ref correctly', () => {
      const ref = jest.fn();
      render(<CardTitle ref={ref}>Title</CardTitle>);

      expect(ref).toHaveBeenCalled();
    });
  });

  describe('CardDescription', () => {
    it('should render with default props', () => {
      render(<CardDescription data-testid="desc">Description</CardDescription>);

      const desc = screen.getByTestId('desc');
      expect(desc).toBeInTheDocument();
      expect(desc).toHaveTextContent('Description');
      expect(desc).toHaveClass('text-sm', 'text-muted-foreground');
    });

    it('should merge custom className', () => {
      render(<CardDescription className="custom-desc" data-testid="desc">Desc</CardDescription>);

      const desc = screen.getByTestId('desc');
      expect(desc).toHaveClass('custom-desc');
    });

    it('should forward ref correctly', () => {
      const ref = jest.fn();
      render(<CardDescription ref={ref}>Description</CardDescription>);

      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLParagraphElement);
    });
  });

  describe('CardContent', () => {
    it('should render with default props', () => {
      render(<CardContent data-testid="content">Content</CardContent>);

      const content = screen.getByTestId('content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveTextContent('Content');
      expect(content).toHaveClass('p-6', 'pt-0');
    });

    it('should merge custom className', () => {
      render(<CardContent className="custom-content" data-testid="content">Content</CardContent>);

      const content = screen.getByTestId('content');
      expect(content).toHaveClass('custom-content');
    });

    it('should forward ref correctly', () => {
      const ref = jest.fn();
      render(<CardContent ref={ref}>Content</CardContent>);

      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardFooter', () => {
    it('should render with default props', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);

      const footer = screen.getByTestId('footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveTextContent('Footer');
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
    });

    it('should merge custom className', () => {
      render(<CardFooter className="custom-footer" data-testid="footer">Footer</CardFooter>);

      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('custom-footer');
    });

    it('should forward ref correctly', () => {
      const ref = jest.fn();
      render(<CardFooter ref={ref}>Footer</CardFooter>);

      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Full Card composition', () => {
    it('should render a complete card', () => {
      render(
        <Card data-testid="card">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description text</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content goes here</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Card Title' })).toBeInTheDocument();
      expect(screen.getByText('Card description text')).toBeInTheDocument();
      expect(screen.getByText('Card content goes here')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });
  });
});
