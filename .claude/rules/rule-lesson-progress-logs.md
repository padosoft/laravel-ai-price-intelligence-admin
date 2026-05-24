# Rule: LESSON.md & PROGRESS.md discipline + strict per-phase loop

- Before changing code, read `docs/LESSON.md` and `docs/PROGRESS.md`.
- Update `docs/PROGRESS.md` after every meaningful step so an interrupted session can resume cold.
- Append to `docs/LESSON.md` whenever you learn something non-obvious, fix a bug, hit an environment
  quirk, or receive Copilot/CI feedback.
- When spawning a parallel subagent, pass `docs/LESSON.md` (and the relevant PROGRESS.md section).
- Use the shell that resolves the binary: PowerShell on the Windows Herd box, bash on Linux/CI.
- UI source of truth: the realized prototype at `~/Downloads/ai-price-intelligence-web-panel/project/`.
  Recreate pixel-perfect; mirror `screenshoots/`.

## Definition of done (every gate, locally + CI)
composer validate · PHPUnit · Pint · PHPStan level 5 · `tsc --noEmit` · ESLint · Vitest ·
`vite build` · Playwright (+ axe). Playwright must cover every screen and every api/button interaction.

## STRICT per-phase delivery loop (mandatory)
1. Implement the phase.
2. Local loop: run test suites + local Copilot CLI review until clean. Do NOT push before clean.
   `copilot --autopilot --yolo -p "/review the changes on this branch vs origin/main (git diff
   origin/main...HEAD); list concrete actionable bugs only; reply 'NO ISSUES' if none."`
3. Per-phase branch `feat/admin-aN-...`, one PR per phase.
4. Push, open/update PR, request GitHub Copilot review via REST requested_reviewers.
5. Remote loop: CI green AND GitHub Copilot zero actionable comments. Verify findings against
   framework semantics; push back when the reviewer is wrong instead of churning code.
6. Record learnings in `docs/LESSON.md`.
7. AUTO-MERGE & ADVANCE (authorized): squash-merge + delete branch, sync main, next phase, until
   100% → tag v1.0.0 + GitHub release.
