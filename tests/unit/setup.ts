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

afterEach(() => cleanup());
