# Source Directory

When writing or editing code in this directory, follow these standards.
This is a React 19 + Vite web frontend, not an engine project:
skip engine-specific guidance (`docs/engine-reference/`, engine specialists).

## Coding Standards

- Match the surrounding code: React function components and hooks, plain ES
  modules, service modules under `study/` (e.g. `seatService.js`, `navigation.js`)
- Layout coordinates, collision areas and tunable values stay in their config
  modules (`study/companyFinalLayout.js`, `study/characterSprites.js`),
  never hardcoded inside components
- Never edit original art bytes; see `AGENTS.md` and `art-src/`
- Architecture decisions go in `docs/architecture/` as ADRs — **how many depends on
  `modes.workflow`**: all at `full`, critical only at `standard`, none required at
  `minimal` (the decision log carries them)
- Commits should reference the relevant story ID or design document when one exists

## Tests

Tests live in `tests/*.test.mjs` — not in `src/`.
Run `npm run build`, then `npm test` against the running dev server.
For UI changes, verify with screenshots (`screenshots/`, `scripts/review-*.mjs`).
Compare expected output to actual output before marking work complete.
