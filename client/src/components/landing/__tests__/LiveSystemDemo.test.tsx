import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LiveSystemDemo } from '../LiveSystemDemo';

// Mock the hook to return fallback data
jest.mock('@/hooks/useLandingStats', () => ({
  useLiveDemoData: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
}));

describe('LiveSystemDemo', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
  };

  it('renders without crashing when API data is unavailable', () => {
    renderWithQueryClient(<LiveSystemDemo />);

    // Should show demo data indicators
    expect(screen.getByText('Demo Data')).toBeInTheDocument();
    expect(screen.getByText('Interactive System Demo')).toBeInTheDocument();
  });

  it('displays fallback metrics when API fails', () => {
    renderWithQueryClient(<LiveSystemDemo />);

    // Should show fallback real-time metrics
    expect(screen.getByText('42')).toBeInTheDocument(); // activeUsers
    expect(screen.getByText('187')).toBeInTheDocument(); // requestsToday
    expect(screen.getByText('165ms')).toBeInTheDocument(); // responseTime
    expect(screen.getByText('35%')).toBeInTheDocument(); // systemLoad
  });

  it('displays sample equipment data', () => {
    renderWithQueryClient(<LiveSystemDemo />);

    // Should show sample equipment
    expect(screen.getByText('CNC Machine #1')).toBeInTheDocument();
    expect(screen.getByText('Manufacturing')).toBeInTheDocument();
  });

  it('displays sample requests data', () => {
    renderWithQueryClient(<LiveSystemDemo />);

    // Should show sample requests
    expect(screen.getByText('Oil leak in hydraulic system')).toBeInTheDocument();
    expect(screen.getByText('Mechanics Team')).toBeInTheDocument();
  });

  it('displays sample teams data', () => {
    renderWithQueryClient(<LiveSystemDemo />);

    // Should show sample teams
    expect(screen.getByText('Mechanics Team')).toBeInTheDocument();
    expect(screen.getByText('Mechanical Repair')).toBeInTheDocument();
  });
});
