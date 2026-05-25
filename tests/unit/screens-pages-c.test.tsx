import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/api/queryClient';
import { ToastProvider } from '@/components/ds';
import { AuthProvider } from '@/state/AuthProvider';
import { Anomalies } from '@/routes/Anomalies';
import { Forecasts } from '@/routes/Forecasts';
import { Narrative } from '@/routes/Narrative';
import { Assortment } from '@/routes/Assortment';
import { ContentGap } from '@/routes/ContentGap';
import { Reviews } from '@/routes/Reviews';

function wrap(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <AuthProvider>
        <ToastProvider>{ui}</ToastProvider>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('Anomalies', () => {
  it('lists detections and filters by type', async () => {
    const user = userEvent.setup();
    wrap(<Anomalies />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Anomaly detection' })).toBeInTheDocument());
    // All 3 fixture anomalies should appear in the table.
    await waitFor(() => expect(screen.getAllByText(/CP #/).length).toBe(3));
    // Click the 'price_error' chip button to filter the table.
    const chip = screen.getByRole('button', { name: /price_error/ });
    await user.click(chip);
    // Only the 1 price_error row should remain in the table.
    await waitFor(() => expect(screen.getAllByText(/CP #/).length).toBe(1));
  });
});

describe('Forecasts', () => {
  it('renders the forecast list and CI cards', async () => {
    wrap(<Forecasts />);
    await waitFor(() => expect(screen.getByRole('heading', { name: /Price forecasts/ })).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Confidence interval')).toBeInTheDocument());
  });
});

describe('Narrative', () => {
  it('renders the markdown digest with a period selector', async () => {
    wrap(<Narrative />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Weekly narrative' })).toBeInTheDocument());
    // The fixture summary_md contains an h2 heading rendered from markdown.
    await waitFor(() => expect(screen.getByRole('heading', { name: /Aggressive undercut/ })).toBeInTheDocument());
    expect(screen.getByLabelText('Narrative period')).toBeInTheDocument();
  });

  it('exports the narrative to PDF via the print dialog', async () => {
    const user = userEvent.setup();
    const printSpy = vi.fn();
    vi.stubGlobal('print', printSpy);
    wrap(<Narrative />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Weekly narrative' })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Export PDF/ }));
    await waitFor(() => expect(screen.getByText('Preparing PDF')).toBeInTheDocument());
    expect(printSpy).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe('Assortment', () => {
  it('aggregates gaps into categories and lists gap detail', async () => {
    wrap(<Assortment />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Assortment gaps' })).toBeInTheDocument());
    // A gap title from the fixture appears in the detail table.
    await waitFor(() => expect(screen.getByText('Rival Z9 256GB')).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Top categories' })).toBeInTheDocument();
  });

  it('exports assortment gaps as CSV (client-side)', async () => {
    const user = userEvent.setup();
    wrap(<Assortment />);
    await waitFor(() => expect(screen.getByText('Rival Z9 256GB')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Export/ }));
    await waitFor(() => expect(screen.getByText('Export ready')).toBeInTheDocument());
  });
});

describe('ContentGap', () => {
  it('shows recommendations for the selected product', async () => {
    wrap(<ContentGap />);
    await waitFor(() => expect(screen.getByRole('heading', { name: /Content gap analysis/ })).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Missing or weak attributes')).toBeInTheDocument());
    expect(screen.getByText('Image count gap')).toBeInTheDocument();
  });
});

describe('Reviews', () => {
  it('renders the sentiment gauge and theme bars', async () => {
    wrap(<Reviews />);
    await waitFor(() => expect(screen.getByRole('heading', { name: /Review insights/ })).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Theme bars · what they talk about')).toBeInTheDocument());
    expect(screen.getByText('Battery life')).toBeInTheDocument();
  });
});
