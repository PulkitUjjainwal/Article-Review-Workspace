import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
}));

// Simple component tests
describe('Button Components', () => {
  test('should render a button', () => {
    render(<button>Click me</button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  test('should render disabled button', () => {
    render(<button disabled>Disabled</button>);
    const button = screen.getByRole('button', { name: /disabled/i });
    expect(button).toBeDisabled();
  });

  test('should render button with className', () => {
    render(<button className="test-class">Styled</button>);
    const button = screen.getByRole('button', { name: /styled/i });
    expect(button).toHaveClass('test-class');
  });
});

describe('Status Badge Component', () => {
  function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
      PENDING: 'bg-gray-100 text-gray-800',
      INCLUDE: 'bg-green-100 text-green-800',
      EXCLUDE: 'bg-red-100 text-red-800',
      MAYBE: 'bg-yellow-100 text-yellow-800',
    };

    return (
      <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status]}`}>
        {status}
      </span>
    );
  }

  test('should render PENDING badge with correct styling', () => {
    render(<StatusBadge status="PENDING" />);
    const badge = screen.getByText('PENDING');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  test('should render INCLUDE badge with correct styling', () => {
    render(<StatusBadge status="INCLUDE" />);
    const badge = screen.getByText('INCLUDE');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  test('should render EXCLUDE badge with correct styling', () => {
    render(<StatusBadge status="EXCLUDE" />);
    const badge = screen.getByText('EXCLUDE');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
  });

  test('should render MAYBE badge with correct styling', () => {
    render(<StatusBadge status="MAYBE" />);
    const badge = screen.getByText('MAYBE');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  test('should have common styling classes', () => {
    render(<StatusBadge status="PENDING" />);
    const badge = screen.getByText('PENDING');
    expect(badge).toHaveClass('rounded-full', 'px-2', 'py-1', 'text-xs', 'font-medium');
  });
});

describe('Input Component', () => {
  test('should render text input', () => {
    render(<input type="text" placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
  });

  test('should render input with value', () => {
    render(<input type="text" value="Test value" readOnly />);
    const input = screen.getByDisplayValue('Test value');
    expect(input).toBeInTheDocument();
  });

  test('should render disabled input', () => {
    render(<input type="text" disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  test('should render required input', () => {
    render(<input type="text" required />);
    const input = screen.getByRole('textbox');
    expect(input).toBeRequired();
  });
});

describe('Checkbox Component', () => {
  test('should render unchecked checkbox', () => {
    render(<input type="checkbox" aria-label="Test checkbox" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  test('should render checked checkbox', () => {
    render(<input type="checkbox" checked readOnly aria-label="Test checkbox" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  test('should render disabled checkbox', () => {
    render(<input type="checkbox" disabled aria-label="Test checkbox" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });
});

describe('Article Card Component', () => {
  interface Article {
    id: string;
    title: string;
    authors?: string;
    journal?: string;
    publicationYear?: string;
    reviewDecision: string;
  }

  function ArticleCard({ article }: { article: Article }) {
    return (
      <div className="article-card" data-testid={`article-${article.id}`}>
        <h3>{article.title}</h3>
        {article.authors && <p className="authors">{article.authors}</p>}
        {article.journal && <p className="journal">{article.journal}</p>}
        {article.publicationYear && <p className="year">{article.publicationYear}</p>}
        <span className="status">{article.reviewDecision}</span>
      </div>
    );
  }

  test('should render article with all fields', () => {
    const article = {
      id: '1',
      title: 'Test Article',
      authors: 'Smith J, Doe A',
      journal: 'Nature',
      publicationYear: '2020',
      reviewDecision: 'PENDING',
    };

    render(<ArticleCard article={article} />);

    expect(screen.getByText('Test Article')).toBeInTheDocument();
    expect(screen.getByText('Smith J, Doe A')).toBeInTheDocument();
    expect(screen.getByText('Nature')).toBeInTheDocument();
    expect(screen.getByText('2020')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  test('should render article with minimal fields', () => {
    const article = {
      id: '2',
      title: 'Minimal Article',
      reviewDecision: 'INCLUDE',
    };

    render(<ArticleCard article={article} />);

    expect(screen.getByText('Minimal Article')).toBeInTheDocument();
    expect(screen.getByText('INCLUDE')).toBeInTheDocument();
    expect(screen.queryByText(/smith j, doe a/i)).not.toBeInTheDocument();
  });

  test('should render article with testid', () => {
    const article = {
      id: '3',
      title: 'Test',
      reviewDecision: 'EXCLUDE',
    };

    render(<ArticleCard article={article} />);
    expect(screen.getByTestId('article-3')).toBeInTheDocument();
  });
});

describe('Loading Spinner Component', () => {
  function LoadingSpinner() {
    return (
      <div role="status" aria-label="Loading">
        <div className="animate-spin">⏳</div>
      </div>
    );
  }

  test('should render loading spinner', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  test('should have correct aria-label', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toBeInTheDocument();
  });

  test('should have animation class', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status').querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});

describe('Empty State Component', () => {
  function EmptyState({ message }: { message: string }) {
    return (
      <div className="empty-state" role="status">
        <p>{message}</p>
      </div>
    );
  }

  test('should render empty state message', () => {
    render(<EmptyState message="No articles found" />);
    expect(screen.getByText('No articles found')).toBeInTheDocument();
  });

  test('should have role status', () => {
    render(<EmptyState message="Empty" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

describe('Error Message Component', () => {
  function ErrorMessage({ error }: { error: string }) {
    return (
      <div role="alert" className="error-message">
        <span>⚠️</span>
        <span>{error}</span>
      </div>
    );
  }

  test('should render error message', () => {
    render(<ErrorMessage error="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  test('should have role alert', () => {
    render(<ErrorMessage error="Error" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  test('should display error icon', () => {
    render(<ErrorMessage error="Error" />);
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });
});
