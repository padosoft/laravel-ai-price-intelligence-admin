import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/api/queryClient';
import { ToastProvider } from '@/components/ds';
import { AuthProvider } from '@/state/AuthProvider';
import { Repricer } from '@/routes/Repricer';
import { Alerts } from '@/routes/Alerts';
import { Webhooks } from '@/routes/Webhooks';
import { ApiKeys } from '@/routes/ApiKeys';
import { Compliance } from '@/routes/Compliance';
import { Settings } from '@/routes/Settings';

function wrap(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <AuthProvider>
        <ToastProvider>{ui}</ToastProvider>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('Repricer', () => {
  it('lists rules and shows the advisory decisions log', async () => {
    wrap(<Repricer />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Repricer rules' })).toBeInTheDocument());
    // The selected rule's name renders as the detail card heading (also appears in the list button).
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Beat Amazon by 2% with margin floor' })).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Recent decisions' })).toBeInTheDocument();
  });
});

describe('Alerts', () => {
  it('renders the inbox and filters by severity', async () => {
    const user = userEvent.setup();
    wrap(<Alerts />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Alerts inbox' })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /^all$/ }));
    await waitFor(() => expect(screen.getAllByText(/ago|UTC|:/).length).toBeGreaterThan(0));
  });
});

describe('Webhooks', () => {
  it('lists subscriptions', async () => {
    wrap(<Webhooks />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Webhook subscriptions' })).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('https://marginos.acme.it/webhooks/price-intel')).toBeInTheDocument());
  });
});

describe('ApiKeys', () => {
  it('lists keys and reveals a generated key once', async () => {
    const user = userEvent.setup();
    wrap(<ApiKeys />);
    await waitFor(() => expect(screen.getByText('MarginOS production')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Generate key/ }));
    await waitFor(() => expect(screen.getByText(/New key — shown once/)).toBeInTheDocument());
  });
});

describe('Compliance', () => {
  it('renders the EU AI Act checks', async () => {
    wrap(<Compliance />);
    await waitFor(() => expect(screen.getByRole('heading', { name: /Compliance/, level: 1 })).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Compliance checks' })).toBeInTheDocument();
  });
});

describe('Settings', () => {
  it('shows tenant info and switches sections', async () => {
    const user = userEvent.setup();
    wrap(<Settings />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /AI providers/ }));
    await waitFor(() => expect(screen.getByText(/feature flags/i)).toBeInTheDocument());
  });
});
