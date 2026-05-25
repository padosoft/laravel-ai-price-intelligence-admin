import { render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/api/queryClient';
import { AlertStreamProvider } from '@/lib/realtime/AlertStreamProvider';
import { useAlertStream } from '@/lib/realtime/alert-stream-context';

function Probe() {
  const { supported, connected } = useAlertStream();
  return <div data-testid="state">{`${supported}-${connected}`}</div>;
}

describe('AlertStreamProvider', () => {
  it('does not open a live connection against the mock layer', () => {
    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AlertStreamProvider>
          <Probe />
        </AlertStreamProvider>
      </QueryClientProvider>,
    );
    // useMocks is true in tests → SSE unsupported, no EventSource is constructed.
    expect(screen.getByTestId('state').textContent).toBe('false-false');
  });
});
