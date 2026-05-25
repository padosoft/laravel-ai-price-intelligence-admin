import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/api/queryClient';
import { ToastProvider } from '@/components/ds';
import { Matches } from '@/routes/Matches';
import { Competitors } from '@/routes/Competitors';
import { CompetitorDetail } from '@/routes/CompetitorDetail';
import { Prices } from '@/routes/Prices';
import { resetMatchMocks } from '@/lib/api/mocks';

function wrap(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <ToastProvider>{ui}</ToastProvider>
    </QueryClientProvider>,
  );
}

describe('Matches', () => {
  beforeEach(() => resetMatchMocks());

  it('renders the first candidate with its evidence breakdown', async () => {
    wrap(<Matches />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Matches review' })).toBeInTheDocument());
    // First fixture proposal candidate title.
    await waitFor(() => expect(screen.getByText(/Acme X1 Pro 5G 128GB/)).toBeInTheDocument());
    expect(screen.getByText('MPN + Brand')).toBeInTheDocument();
    expect(screen.getByText(/6 matchers/)).toBeInTheDocument();
  });

  it('approves a candidate and advances the queue', async () => {
    const user = userEvent.setup();
    wrap(<Matches />);
    await waitFor(() => expect(screen.getByText(/Acme X1 Pro 5G 128GB/)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Confirm/ }));
    await waitFor(() => expect(screen.getByText('Match approved')).toBeInTheDocument());
    // The deck advances to the next candidate.
    await waitFor(() => expect(screen.getByText(/AirBuds 3 Pro/)).toBeInTheDocument());
  });

  it('does not skip the next candidate after the server removes the processed item', async () => {
    // Regression: without a local queue, refetch after approve could shift the array and
    // cause idx+1 to land on the wrong (or missing) item.
    const user = userEvent.setup();
    wrap(<Matches />);
    await waitFor(() => expect(screen.getByText(/Acme X1 Pro 5G 128GB/)).toBeInTheDocument());
    // Mock now removes the approved proposal from subsequent GET /matches?status=pending.
    await user.click(screen.getByRole('button', { name: /Confirm/ }));
    await waitFor(() => expect(screen.getByText(/AirBuds 3 Pro/)).toBeInTheDocument());
    // Approve the second item — should advance to third (Nova OLED), not skip it.
    await user.click(screen.getByRole('button', { name: /Confirm/ }));
    await waitFor(() => expect(screen.getAllByText(/Nova OLED/).length).toBeGreaterThan(0));
  });
});

describe('Competitors', () => {
  it('lists confirmed listings and filters by host', async () => {
    const user = userEvent.setup();
    wrap(<Competitors onNavigate={() => {}} />);
    await waitFor(() => expect(screen.getAllByText('amazon.it').length).toBeGreaterThan(0));
    // trovaprezzi listing present before filtering.
    expect(screen.getByText('https://trovaprezzi.it/x')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^mediaworld\.it/ }));
    await waitFor(() => expect(screen.queryByText('https://trovaprezzi.it/x')).not.toBeInTheDocument());
  });

  it('navigates to the competitor detail on row activation', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    wrap(<Competitors onNavigate={onNavigate} />);
    await waitFor(() => expect(screen.getByText('https://amazon.it/dp/B0XYZ')).toBeInTheDocument());
    const row = screen.getByText('https://amazon.it/dp/B0XYZ').closest('tr') as HTMLElement;
    await user.click(row);
    expect(onNavigate).toHaveBeenCalledWith('competitor_detail', { competitorId: 5001 });
  });
});

describe('CompetitorDetail', () => {
  it('renders the header and switches to the audit tab', async () => {
    const user = userEvent.setup();
    wrap(<CompetitorDetail competitorId={5001} onNavigate={() => {}} />);
    await waitFor(() => expect(screen.getByRole('heading', { name: /Acme X1 Pro/ })).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Price history' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Audit' }));
    await waitFor(() => expect(screen.getByText('Fetch audit log')).toBeInTheDocument());
  });
});

describe('Prices', () => {
  it('renders the explorer with a product selected and a competitor table', async () => {
    wrap(<Prices />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Prices explorer' })).toBeInTheDocument());
    // Product dropdown is populated from the catalog mock.
    await waitFor(() => expect(screen.getByLabelText('Product')).toBeInTheDocument());
    expect(screen.getByText('Competitor prices')).toBeInTheDocument();
  });
});
