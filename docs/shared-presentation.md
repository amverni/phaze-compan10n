# Shared presentation contracts

These contracts were introduced in [#12](https://github.com/amverni/phaze-compan10n/issues/12) and integrated across both Scorekeepers through [#27](https://github.com/amverni/phaze-compan10n/issues/27). Domain terminology lives in [CONTEXT.md](../CONTEXT.md); shared presentation does not share scoring rules.

## Page layout

`src/components/PageShell/PageShell.tsx` owns header, scrolling main content, and footer layout. It handles stable mobile viewport sizing, desktop viewport coverage, Safe Areas, footer press clearance, and bottom Visual Bleed. Its content slots accept ordinary React nodes; optional decoration slots are noninteractive and hidden from assistive technology.

The shell has no logo, disclaimer, scoring controls, or slant by default. The concrete CSS layout values are:

- `--page-shell-panel-height`: responsive base panel height; skins can derive separate header and footer heights from it.
- `--page-shell-footer-control-size`: 56px, or 44px on viewports at most 700px tall; footer controls should use this size.
- `--page-shell-press-clearance`: room for existing 10% press growth.
- `--page-shell-edge-offset`: zero unless the page's decoration needs overlapping angled panels.
- `--page-shell-footer-note-height`: zero unless the footer includes a note.

`CardBackground` is the Phase Compan10n skin, consumed by Home, Create Game, Game, Players, Phases, Settings, and Phases Card pages. It supplies the slanted surfaces and Mattel disclaimer, and sets the edge offset and note height. Existing logos and Phase-specific controls remain with their existing page consumers. `ScorekeeperShell` composes `PageShell` with flat decorations and the one-line Scorekeeper logo; it does not hide or disable parts of `CardBackground`.

`ScorekeeperShell` alone uses compact geometry: its flat header edge sits at the midpoint of the corresponding Phase slant (`--page-shell-panel-height` minus half of `--slant`), with a 64px minimum to keep header controls usable on short screens. Its footer is the responsive control height plus 12px above and 12px below, without Phase's decorative offset. Top and bottom Safe Areas are added separately. At 390x844 with zero insets, the header is approximately 101.6px and the footer is 80px; the compact 44px controls produce a 68px footer. The recovered space belongs to the scrolling main region, with no replacement spacer. Phase panel geometry, disclaimer, and control alignment are unchanged.

The Generic Game header layers its viewport-centered logo independently from the right-aligned Standings control. Symmetric clearance for the control and the larger horizontal Safe Area lets the word shrink uniformly on narrow screens without moving when Standings is absent or disabled. The control retains Safe Area and press clearance while the noninteractive stripes bleed to both viewport edges.

## Player presentation

`PlayerIdentity` in `src/types/player.ts` requires only `id`, `name`, and `color`. Saved `Player` extends it with persistence-specific fields. The data/API layer captures identities at completion and selects snapshots for completed surfaces instead of live saved Players.

Player rows, avatar stacks, the Phase scoreboard and score-entry chain, Standings, and graph presentation accept this identity contract. The avatar badge itself only needs name and color, which also permits unsaved preview values. Saved-Player editing and Favorite controls still require a saved `Player`.

Phase `deriveStandings` preserves the input Player subtype for included Players, rows, and the winner. This lets current automatic completion continue using saved-Player data without casts, while identity-only inputs can supply read-only presentation. This generic type parameter does not generalize Phase scoring rules.

## Retained shared boundaries

No temporary presentation adapters were introduced. `CardBackground` is an actively used Phase-specific skin, not an obsolete compatibility wrapper. The shared shell selectors replace the old structural `card-panel-*-content`/`card-panel-main` selectors; there are no legacy selector aliases to remove.

Both scoreboards share `FinishGameMenu`, anchored above the footer flag with Pause, Resume, and Finish (or destructive Delete for a known zero-Round Active Game). Its controlled popup initially focuses Resume and blocks dismissal during mutations. Shared `PlainButton` controls keep the anchor fixed while its inner glass surface enlarges; menu rows do not enlarge into adjacent actions. Quick deletion rechecks ownership, Active status, and zero saved Rounds in the same transaction as Game-owned cleanup; Games-list deletion remains separate. Failed quick deletion refreshes eligibility, and cached scoreboards stay mounted but inert through read errors so retry does not discard an unsaved draft.

Generic modes share `GenericRoundDialog` and its draft/submission lifecycle while retaining mode-specific entry bodies. `GraphPlot` shares plotting and accessible-table presentation, not Phase or generic scoring calculations. Standings rows allocate remaining width to names and reserve secondary-score space only when a metric is present.

Both scoreboards use the compact grid, sticky cells, borders, and expanded-result styling in `Scoreboard/scoreboard.css`, with icon-and-initial Player badges. The generic scoreboard retains semantic table rows and headers, uses intrinsic Player column widths for signed safe-integer totals, and renders only generic results supplied by the API. Its upcoming row has blank Player cells except for an optional Dealer marker; completed Games have no upcoming row.

Game-list trash actions use the shared `Button` with `variant="plain"` on both Home and Games history. This omits the persistent glass surface while preserving press, disabled, and keyboard-only focus feedback; the focus outline uses the current text color for visibility in both themes. Other Buttons retain their default glass styling.
