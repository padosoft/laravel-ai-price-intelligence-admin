import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { runtimeConfig } from './config';
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
