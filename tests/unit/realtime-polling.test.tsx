import { render } from '@testing-library/react';
import { useContext } from 'react';
import { afterEach, beforeEach, vi } from 'vitest';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/api/queryClient';

// Force a bearer/headless runtime (no mocks) so the provider takes the polling fallback path —
// SSE requires cookie auth, so bearer always degrades to interval polling.
vi.mock('@/config', () => ({
  runtimeConfig: {
    apiBaseUrl: '/api/v1',
    auth: { mode: 'bearer' },
    locale: 'en',
    csrfCookie: 'XSRF-TOKEN',
    realtime: { driver: 'sse', pollIntervalMs: 1000 },
    useMocks: false,
  },
  apiBase: '/api/v1',
  alertStreamUrl: () => 'http://localhost/api/v1/alerts/stream',
}));

import { AlertStreamProvider } from '@/lib/realtime/AlertStreamProvider';
import { AlertStreamContext } from '@/lib/realtime/alert-stream-context';

describe('AlertStreamProvider polling fallback (bearer/headless)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('polls ["alerts"] on the configured interval when SSE is unavailable', () => {
    const qc = createQueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    let mode = '';
    function Probe() {
      mode = useContext(AlertStreamContext).mode;
      return null;
    }

    render(
      <QueryClientProvider client={qc}>
        <AlertStreamProvider><Probe /></AlertStreamProvider>
      </QueryClientProvider>,
    );

    // Bearer mode → polling transport; no immediate invalidate, then one per interval tick.
    expect(mode).toBe('polling');
    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(spy).toHaveBeenCalledWith({ queryKey: ['alerts'] });
    vi.advanceTimersByTime(1000);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
