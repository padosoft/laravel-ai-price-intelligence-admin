import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/api/queryClient';
import { AuthProvider } from '@/state/AuthProvider';
import { useAuth, useFeature, useAbility } from '@/state/auth-context';

function Probe() {
  const { me } = useAuth();
  const repricer = useFeature('repricer');
  const wildcard = useAbility('anything');
  return (
    <div>
      <span data-testid="tenant">{me?.tenant.code ?? '—'}</span>
      <span data-testid="repricer">{String(repricer)}</span>
      <span data-testid="ability">{String(wildcard)}</span>
    </div>
  );
}

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <AuthProvider>{ui}</AuthProvider>
    </QueryClientProvider>,
  );
}

describe('AuthProvider', () => {
  it('hydrates tenant, features and abilities from /tenants/me', async () => {
    renderWithProviders(<Probe />);
    await waitFor(() => expect(screen.getByTestId('tenant')).toHaveTextContent('ACME'));
    expect(screen.getByTestId('repricer')).toHaveTextContent('true');
    // '*' ability grants any ability.
    expect(screen.getByTestId('ability')).toHaveTextContent('true');
  });
});
