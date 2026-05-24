# LESSON.md — laravel-ai-price-intelligence-admin

Append learnings, environment quirks, and Copilot/CI feedback here. Carry the core's lessons too
(see `../laravel-ai-price-intelligence/AGENTS.md` "Distilled lessons").

## Environment
- Windows Herd dev box: PHP 8.4 + Composer 2.9 on PowerShell PATH (not bash). Node 25 / npm 11.
  Use the shell that resolves the binary; bash on Linux/CI.
- Frontend folder is `resources/js/` to avoid colliding with PHP PSR-4 `src/`.

## Tooling decisions
- Stack pinned to latest stable at scaffold time: React 19, Vite 6, TS 5.7, Tailwind 4 (via
  `@tailwindcss/vite`), Vitest 2, Playwright 1.49, TanStack Query 5, i18next 24, Recharts 2,
  Lucide. The TEMPLATE.md "min" column lists aspirational floors; `npm install` resolves actual latest.
- Playwright runs against `vite preview` of the built SPA with MSW fixtures → deterministic, no live
  Laravel backend needed in CI.

## Per-phase loop
- Same strict loop as the core: local tests + local Copilot → push → CI green + GitHub Copilot zero
  comments → squash-merge + delete branch → next phase.
