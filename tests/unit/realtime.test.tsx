import { render, screen } from '@testing-library/react';
import { afterEach } from 'vitest';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/api/queryClient';
import { AlertStreamProvider } from '@/lib/realtime/AlertStreamProvider';
import { useAlertStream } from '@/lib/realtime/alert-stream-context';

function Probe() {
  const { supported, connected } = useAlertStream();
  return <div data-testid="state">{`${supported}-${connected}`}</div>;
}

const original = (globalThis as { EventSource?: unknown }).EventSource;
afterEach(() => {
  (globalThis as { EventSource?: unknown }).EventSource = original;
});

describe('AlertStreamProvider', () => {
  it('does not open a connection against the mock layer even when EventSource exists', () => {
    // Force EventSource to exist so the "supported" check isn't trivially false in jsdom;
    // the provider must still refuse to connect because useMocks is true in tests.
    const ctor = vi.fn();
    (globalThis as { EventSource?: unknown }).EventSource = ctor;

    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AlertStreamProvider>
          <Probe />
        </AlertStreamProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('state').textContent).toBe('false-false');
    expect(ctor).not.toHaveBeenCalled();
  });
});
