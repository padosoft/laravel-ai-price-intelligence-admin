import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Runtime config fallback for component tests (mirrors index.html dev fallback).
window.__PI_ADMIN__ = {
  apiBaseUrl: '/api/v1',
  auth: { mode: 'cookie' },
  locale: 'it',
  csrfCookie: 'XSRF-TOKEN',
  realtime: { driver: 'sse' },
  useMocks: true,
};

// jsdom in this environment doesn't expose a working localStorage / matchMedia;
// provide minimal in-memory stubs so theme persistence code runs under test.
// Accessing window.localStorage can itself throw in some configs, so probe defensively.
let hasLocalStorage = false;
try {
  hasLocalStorage = typeof window.localStorage?.getItem === 'function';
} catch {
  hasLocalStorage = false;
}
if (!hasLocalStorage) {
  const store = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
    },
  });
}

if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
      onchange: null,
    }),
  });
}

if (typeof Element.prototype.scrollTo !== 'function') {
  Element.prototype.scrollTo = () => {};
}

// @tanstack/react-virtual instantiates a ResizeObserver, which jsdom doesn't provide; stub a
// no-op so virtualized lists don't crash under test. (With no measurable viewport in jsdom the
// virtualizer yields an empty window and VirtualTable falls back to rendering all rows.)
if (typeof globalThis.ResizeObserver !== 'function') {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
}

afterEach(() => cleanup());
