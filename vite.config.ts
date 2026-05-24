import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

// Builds the SPA into resources/dist/ with hashed filenames; PanelController serves
// the generated manifest through a Blade wrapper. Dev server proxies /api to the host.
// import.meta.dirname (Node 20.11+) is the ESM-correct replacement for __dirname.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': resolve(import.meta.dirname, 'resources/js') },
  },
  // Relative base so the built index.html works both under `vite preview` (e2e) and
  // when published under /vendor/price-intelligence-admin/ in the host app. The Blade
  // wrapper resolves hashed asset URLs from the manifest via asset(), independent of base.
  base: './',
  build: {
    outDir: 'resources/dist',
    emptyOutDir: true,
    manifest: true,
  },
  server: {
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/sanctum': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
});
