# Claude / Agent Instructions

Follow `AGENTS.md`. **Read `docs/LESSON.md` and `docs/PROGRESS.md` before making changes**, and keep
them updated (PROGRESS.md after every step; LESSON.md whenever you learn something or get Copilot/CI
feedback).

The realized UI prototype (pixel-perfect source of truth) is at
`C:\Users\lopad\Downloads\ai-price-intelligence-web-panel\project\`. Screenshots: `screenshoots/`.

Use the shell that resolves the binary: PowerShell for php/composer/vendor on the Windows Herd box;
bash on Linux/CI. Node ≥ 24 for the frontend.

No task is complete until all gates pass locally and in GitHub Actions: composer validate, PHPUnit,
Pint, PHPStan, tsc, ESLint, Vitest, vite build, Playwright (+ axe). The admin requires Playwright
scenarios for every screen and every api/button interaction.

For PRs, request GitHub Copilot Code Review and resolve it before merge; record learnings in
`docs/LESSON.md`. When spawning parallel subagents, pass `docs/LESSON.md` into their context.
