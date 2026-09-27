# Shared presentation contracts

This is the handoff from [#12](https://github.com/amverni/phaze-compan10n/issues/12) to the completed-result and routing slices (#14 and #15). Domain terminology lives in [CONTEXT.md](../CONTEXT.md); these contracts do not share scoring rules or change persisted records.

## Page layout

`src/components/PageShell/PageShell.tsx` owns header, scrolling main content, and footer layout. It handles stable mobile viewport sizing, desktop viewport coverage, Safe Areas, footer press clearance, and bottom Visual Bleed. Its content slots accept ordinary React nodes; optional decoration slots are noninteractive and hidden from assistive technology.

The shell has no logo, disclaimer, scoring controls, or slant by default. The concrete CSS layout values are:

- `--page-shell-panel-height`: responsive header/footer height.
- `--page-shell-footer-control-size`: 56px, or 44px on viewports at most 700px tall; footer controls should use this size.
- `--page-shell-press-clearance`: room for existing 10% press growth.
- `--page-shell-edge-offset`: zero unless the page's decoration needs overlapping angled panels.
- `--page-shell-footer-note-height`: zero unless the footer includes a note.

`CardBackground` is the Phase Compan10n skin, consumed by Home, Create Game, Game, Players, Phases, Settings, and Phases Card pages. It supplies the slanted surfaces and Mattel disclaimer, and sets the edge offset and note height. Existing logos and Phase-specific controls remain with their existing page consumers. Generic pages should compose `PageShell` directly, not hide or disable parts of `CardBackground`.

## Player presentation

`PlayerIdentity` in `src/types/player.ts` requires only `id`, `name`, and `color`. Saved `Player` extends it with persistence-specific fields. Snapshot creation, storage, and selection remain the responsibility of the later data/API slice.

Player rows, avatar stacks, the Phase scoreboard and score-entry chain, Standings, and graph presentation accept this identity contract. The avatar badge itself only needs name and color, which also permits unsaved preview values. Saved-Player editing and Favorite controls still require a saved `Player`.

Phase `deriveStandings` preserves the input Player subtype for included Players, rows, and the winner. This lets current automatic completion continue using saved-Player data without casts, while identity-only inputs can supply read-only presentation. This generic type parameter does not generalize Phase scoring rules.

## Cleanup handoff for #27

No temporary adapters were introduced. `CardBackground` is an actively used Phase-specific skin, not an obsolete compatibility wrapper. The shared shell selectors replace the old structural `card-panel-*-content`/`card-panel-main` selectors; there are no legacy selector aliases to remove.
