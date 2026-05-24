import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { runtimeConfig } from './config';
// Self-hosted fonts (no external Google Fonts CDN — CSP/air-gap/GDPR friendly).
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import './styles/globals.css';

document.documentElement.lang = runtimeConfig.locale;

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root not found');
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
