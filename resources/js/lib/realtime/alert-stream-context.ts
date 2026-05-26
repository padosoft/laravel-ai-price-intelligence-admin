import { createContext, useContext } from 'react';

/** Live-alert transport in effect: a real SSE stream, an interval-polling fallback, or none. */
export type AlertStreamMode = 'sse' | 'polling' | 'off';

export interface AlertStreamState {
  /** True while the SSE connection is open (sse mode), or whenever polling is active. */
  connected: boolean;
  /** True when a live transport exists (SSE or polling); false in mock/dev (mode 'off'). */
  supported: boolean;
  /** Which transport is active. */
  mode: AlertStreamMode;
}

export const AlertStreamContext = createContext<AlertStreamState>({ connected: false, supported: false, mode: 'off' });

/** Read the live alert-stream connection state (provided by AlertStreamProvider). */
export function useAlertStream(): AlertStreamState {
  return useContext(AlertStreamContext);
}
