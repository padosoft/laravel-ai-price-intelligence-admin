import { renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/api/queryClient';
import { useAlertStream } from '@/lib/realtime/useAlertStream';

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={createQueryClient()}>{children}</QueryClientProvider>;
}

describe('useAlertStream', () => {
  it('does not open a live connection against the mock layer', () => {
    const { result } = renderHook(() => useAlertStream(), { wrapper });
    // useMocks is true in tests → SSE is unsupported, the effect early-returns and no
    // EventSource is ever constructed (so the hook is safe even where EventSource is absent).
    expect(result.current.supported).toBe(false);
    expect(result.current.connected).toBe(false);
  });
});
