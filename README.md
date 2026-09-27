# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Tests

`npm test` runs Vitest behavior tests, including rendered safe-area layout tests
using Playwright WebKit. After installing npm dependencies, install that browser:

```bash
npx playwright install webkit
npm test
```

On Linux CI, use `npx playwright install --with-deps webkit` instead. The browser
tests start and close their own local Vite server; no running app is required.
Device insets are supplied through the shared `--safe-area-inset-*` CSS variables
because desktop WebKit automation does not expose hardware cutouts or Safari's
mobile toolbar. Real-device checks remain necessary for browser-chrome overlap.

## Scorekeeper persistence

All Scorekeepers share `phase10-db`. Schema version 8 deliberately resets disposable
pre-refactor data, including Players, Games/Rounds, custom Phases/Sets, favorites,
and settings. This runs only when upgrading from a version below 8; ordinary
reloads and future upgrades must preserve the new records.

Game/Round records have explicit `scorekeeper` ownership. Shared lifecycle types
live in `src/types/gameLifecycle.ts`; Phase 10 fields remain in the Phase variants.
Completed Games contain `playerSnapshots` (identity/name/color), `winnerIds`, and
`completionType`. Active views use live saved Players; completed views use snapshots.
Normal Phase 10 completion still awards exactly one winner under its existing rules.

Use `withGameTransaction`, `finalizeGame`, and `deleteGameRecords` in
`src/data/api/gameLifecycle.ts` for completion and Game-owned cleanup. Resolve
winners and capture identities inside that transaction, including the finishing
Round write. Later Early Finish and retention work must extend this same boundary.
Whole-Game cleanup preserves shared Players, saved catalog data, and temporary
Phases still referenced by another Game or Phase Set.

Active Game writes must validate shared Player references inside the same
transaction as the write (`requirePlayers`/`saveActiveGame`). Player deletion
checks all Active Game references, regardless of Scorekeeper, in a transaction
that also locks Players. There is no archived/hidden Player state.
The existing `gamesApi.complete(id, winnerId)` is a narrow normal-completion
compatibility entry point, not an Early Finish API.
