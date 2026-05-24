import { createContext, useContext } from 'react';

export type ToastKind = '' | 'error' | 'warn';

export interface ToastInput {
  title: string;
  body?: string;
  kind?: ToastKind;
  /** Auto-dismiss delay in milliseconds (default 3600). */
  duration?: number;
}

export interface ToastEntry extends ToastInput {
  id: string;
}

export interface ToastApi {
  push: (t: ToastInput) => void;
}

export const ToastContext = createContext<ToastApi>({ push: () => {} });

export function useToast(): ToastApi {
  return useContext(ToastContext);
}
