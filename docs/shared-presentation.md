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

Both skins use `PageShell/PanelSurface.tsx` for their header and footer decoration. Its shared `.page-panel-surface` and `.page-panel-shadow` styles preserve Phase Compan10n's original opaque app-background color and drop shadows, with no glass border, shine overlay, or backdrop filtering. Only Phase supplies the slanted clip paths; Scorekeeper keeps flat edges and its existing compact geometry. Decorations span the full panel, including Safe Areas, and share the app-background token with the main background and bottom Visual Bleed. Other glass controls and dialogs are unchanged.

`ScorekeeperShell` alone uses compact geometry: its flat header edge sits at the midpoint of the corresponding Phase slant (`--page-shell-panel-height` minus half of `--slant`), with a 64px minimum to keep header controls usable on short screens. Its footer is the responsive control height plus 12px above and 12px below, without Phase's decorative offset. Top and bottom Safe Areas are added separately. At 390x844 with zero insets, the header is approximately 101.6px and the footer is 80px; the compact 44px controls produce a 68px footer. The recovered space belongs to the scrolling main region, with no replacement spacer. Phase panel geometry, disclaimer, and control alignment are unchanged.

The Generic Game header layers its viewport-centered logo independently from the right-aligned Standings control. Symmetric clearance for the control and the larger horizontal Safe Area lets the word shrink uniformly on narrow screens without moving when Standings is absent or disabled. The control retains Safe Area and press clearance while the noninteractive stripes bleed to both viewport edges.

Home and Game header controls in both Scorekeepers use the footer's shared `content-container`: centered within the horizontal Safe Areas, capped at `max-w-lg`, and padded by `px-4`. This keeps header and footer control edges aligned on wide screens without changing narrow-screen spacing or constraining the independent logo decorations.

Both Game pages use that same container for main content, keeping scoreboards aligned with the controls on desktop. Wide Player grids scroll within the scoreboard rather than widening the page.

## Logo presentation

Both Scorekeepers consume the checked-in [Logo Theme configuration](logo-themes.md) through one `LogoThemeProvider` above routes. It owns system appearance observation, a shared next-local-midnight timer, and focus/visibility catch-up. Selection is independent per Scorekeeper: skip out-of-scope entries, select the first matching theme, otherwise use that Scorekeeper's Base Logo Palette. No game data, Query cache, page surfaces, or Player colors participate.

`ScorekeeperLogo` retains horizontal rectangles and its existing lettering coordinates and stripe center at 59.5625 SVG units. Its fixed band is 66 units tall with gaps of 6. `Logo` retains Phase Compan10n's existing stripe center, `SLANT_PX = 50` slope calculation, lettering, responsive fitting, and Safe Area Visual Bleed; its fixed band is 63 units tall with gaps of 5. For rendered count `n`, stripe thickness is `(bandHeight - (n - 1) * gap) / n`. Two configured colors render as four A/B/A/B stripes; three and four colors retain their count, including duplicates.

The outer band remains centered and unchanged when appearance changes stripe count. Lettering, header height, control clearance, accessible names, and decorative noninteraction remain unchanged. The renderers share palette selection, not a generalized flat/slanted SVG implementation.

## Player presentation

`PlayerIdentity` in `src/types/player.ts` requires only `id`, `name`, and `color`. Saved `Player` extends it with persistence-specific fields. The data/API layer captures identities at completion and selects snapshots for completed surfaces instead of live saved Players.

Player rows, avatar stacks, the Phase scoreboard and score-entry chain, Standings, and graph presentation accept this identity contract. The avatar badge itself only needs name and color, which also permits unsaved preview values. Saved-Player editing and Favorite controls still require a saved `Player`.

Phase `deriveStandings` preserves the input Player subtype for included Players, rows, and the winner. This lets current automatic completion continue using saved-Player data without casts, while identity-only inputs can supply read-only presentation. This generic type parameter does not generalize Phase scoring rules.

## Retained shared boundaries

No temporary presentation adapters were introduced. `CardBackground` is an actively used Phase-specific skin, not an obsolete compatibility wrapper. The shared shell selectors replace the old structural `card-panel-*-content`/`card-panel-main` selectors; there are no legacy selector aliases to remove.

Both scoreboards share `FinishGameMenu`, anchored above the footer flag with Pause and Finish (or destructive Delete for a known zero-Round Active Game). Pointer opening does not autofocus a menu action, and pointer dismissal does not force focus back to the flag. Keyboard opening focuses Pause; Escape restores focus to the flag. Opening and dismissal are handled independently so switching input methods preserves the same behavior. The controlled popup blocks dismissal during mutations. Shared `PlainButton` controls keep the anchor fixed while its inner glass surface enlarges; menu rows do not enlarge into adjacent actions. Quick deletion rechecks ownership, Active status, and zero saved Rounds in the same transaction as Game-owned cleanup; Games-list deletion remains separate. Failed quick deletion refreshes eligibility, and cached scoreboards stay mounted but inert through read errors so retry does not discard an unsaved draft.

Generic modes share `GenericRoundDialog` and its draft/submission lifecycle while retaining mode-specific entry bodies. `GraphPlot` shares plotting and accessible-table presentation, not Phase or generic scoring calculations. Standings rows allocate remaining width to names and reserve secondary-score space only when a metric is present.

Generic Add Round reserves the remaining dialog height for its mode-specific body, with Close/Save actions pinned below it inside the dialog's existing Safe Area and press padding. Nonnumeric long Player lists scroll within the body; their recoverable save errors use a separate keyboard-scrollable area capped at one third of the form height. Numeric entry uses size containers to fit circular keys, typography, and spacing to both available axes without scrolling the keypad. Short numeric bodies place the metrics beside the keypad; numeric save errors share the metric area, with keyboard scrolling for unusually long messages. Player tabs and horizontal swipes remain independent of numeric sizing. None of these compositions changes shared Dialog geometry.

Numeric values longer than any signed safe integer use an abbreviated visual preview so an oversized invalid draft cannot displace its correction controls. The full draft remains available to assistive technology and in the preview's title; entry, validation, and erasure still use the unchanged full value.

Both scoreboards use the compact grid, sticky cells, borders, and expanded-result styling in `Scoreboard/scoreboard.css`, with icon-and-initial Player badges. The generic scoreboard retains semantic table rows and headers, uses intrinsic Player column widths for signed safe-integer totals, and renders only generic results supplied by the API. Its upcoming row has blank Player cells except for an optional Dealer marker; completed Games have no upcoming row.

Game-list trash actions use the shared `Button` with `variant="plain"` on both Home and Games history. This omits the persistent glass surface while preserving press, disabled, and keyboard-only focus feedback; the focus outline uses the current text color for visibility in both themes. Other Buttons retain their default glass styling.

Generic Games may have an optional Game Name, entered in Create Game Settings and normalized at creation. Named scoreboards show a single-line, ellipsized title; unnamed scoreboards have no title or scoring-caption fallback. Generic Home and history rows prioritize the name over avatars within the remaining space beside the fixed timestamp and actions. The avatar stack may show nothing when that space is exhausted, while action labels retain the full Game name and Player roster. Unnamed and Phase Game-list rows retain their avatar-only layout.
