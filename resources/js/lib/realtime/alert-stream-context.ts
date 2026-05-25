import { createContext, useContext } from 'react';

export interface AlertStreamState {
  /** True while the SSE connection is open. */
  connected: boolean;
  /** False when there is no live transport (mock/dev, a non-SSE driver, bearer mode, or no EventSource). */
  supported: boolean;
}

export const AlertStreamContext = createContext<AlertStreamState>({ connected: false, supported: false });

/** Read the live alert-stream connection state (provided by AlertStreamProvider). */
export function useAlertStream(): AlertStreamState {
  return useContext(AlertStreamContext);
}
