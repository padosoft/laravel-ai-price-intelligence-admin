import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach } from 'vitest';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/api/queryClient';
import { resetMockState } from '@/lib/api/mocks';
import { ToastProvider } from '@/components/ds';
import { AuthProvider } from '@/state/AuthProvider';
import { AuthContext, type AuthState } from '@/state/auth-context';
import { Repricer } from '@/routes/Repricer';
import { Alerts } from '@/routes/Alerts';
import { Webhooks } from '@/routes/Webhooks';
import { ApiKeys } from '@/routes/ApiKeys';
import { Compliance } from '@/routes/Compliance';
import { Settings } from '@/routes/Settings';

// The A6 mocks are stateful (generate/revoke/test mutate in-memory collections); reset
// before each test so a generated key in one case can't leak into another.
beforeEach(() => resetMockState());

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
    // Show all (ack filter) first so both high and low alerts are visible.
    await user.click(screen.getByRole('button', { name: /^all$/ }));
    await waitFor(() => expect(screen.getByText('undercut.detected')).toBeInTheDocument());
    // Filter to low severity → the high-severity undercut alert disappears.
    await user.click(screen.getByRole('button', { name: /^low/ }));
    await waitFor(() => expect(screen.queryByText('undercut.detected')).not.toBeInTheDocument());
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

  it('denies access without the apikeys:manage ability', () => {
    const denied: AuthState = {
      isLoading: false,
      isError: false,
      me: null,
      hasFeature: () => true,
      hasAbility: (a: string) => a !== 'apikeys:manage',
    };
    render(
      <QueryClientProvider client={createQueryClient()}>
        <AuthContext.Provider value={denied}>
          <ToastProvider><ApiKeys /></ToastProvider>
        </AuthContext.Provider>
      </QueryClientProvider>,
    );
    expect(screen.getByText('Access denied')).toBeInTheDocument();
    // The generate action must not be available.
    expect(screen.queryByRole('button', { name: /Generate key/ })).not.toBeInTheDocument();
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
