import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/api/queryClient';
import { ToastProvider } from '@/components/ds';
import { Anomalies } from '@/routes/Anomalies';
import { Forecasts } from '@/routes/Forecasts';
import { Narrative } from '@/routes/Narrative';
import { Assortment } from '@/routes/Assortment';
import { ContentGap } from '@/routes/ContentGap';
import { Reviews } from '@/routes/Reviews';

function wrap(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <ToastProvider>{ui}</ToastProvider>
    </QueryClientProvider>,
  );
}

describe('Anomalies', () => {
  it('lists detections and filters by type', async () => {
    const user = userEvent.setup();
    wrap(<Anomalies />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Anomaly detection' })).toBeInTheDocument());
    await waitFor(() => expect(screen.getAllByText(/CP #/).length).toBeGreaterThan(0));
    // The type chips are derived from the anomalies fixture.
    const firstType = screen.getAllByText(/price_error|outlier|batch_update/)[0];
    expect(firstType).toBeInTheDocument();
    await user.click(firstType);
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
});

describe('Assortment', () => {
  it('aggregates gaps into categories and lists gap detail', async () => {
    wrap(<Assortment />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Assortment gaps' })).toBeInTheDocument());
    // A gap title from the fixture appears in the detail table.
    await waitFor(() => expect(screen.getByText('Rival Z9 256GB')).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Top categories' })).toBeInTheDocument();
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
