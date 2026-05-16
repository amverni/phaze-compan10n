# Scorecard — Design Spec

**Status:** Draft → for implementation
**Author / Branch:** `feature/scorecard`
**Source requirements:** `/scorecard.md` (root of repo) including the "Notes / Clarifications" section appended during requirement-gathering.

---

## 1. Goal

Render a scoreboard on the `/game/$gameId` route that shows, for each player in the game, their current phase + tiebreaker value (header), every completed round's per-player result (body), and the upcoming round (ghost row). Allow expanding one body row at a time to reveal per-round and running tiebreaker totals. Tapping the ghost row opens a placeholder score-entry form that persists a new `Round`.

This spec covers the UI + the minimum data-model change required to support it. It does **not** cover: dealer storage (rotation only), wilds tracking, full polished score-entry UX, game-over / winner-screen UI.

---

## 2. Data-model changes

### 2.1 `Round` gains a required `roundWinnerId`

In `src/types/round.ts`:

```ts
export interface Round {
  gameId: GameId;
  roundNumber: number;
  scores: ArrayAtLeastOne<RoundScore>;
  roundWinnerId: PlayerId; // NEW — required, identifies the player who "went out"
}
```

`RoundScore` is unchanged.

### 2.2 API surface change (`src/data/api/rounds.ts`)

`roundsApi.add` accepts `roundWinnerId` (required):

```ts
add(data: {
  gameId: GameId;
  scores: ArrayAtLeastOne<AddRoundScoreInput>;
  roundWinnerId: PlayerId;
}): Promise<Round>
```

`roundsApi.edit` currently accepts only score updates. We will **add** an optional second-arg shape so the winner can be edited later: `edit(gameId, roundNumber, { winnerId?, playerId?, updates? })` — **defer to follow-up**; for this PR `edit` is unchanged. The body row in the scorecard does not support editing yet.

### 2.3 IndexedDB migration (`src/data/db/index.ts`)

Bump DB version from 5 → 6. Add a migration step that backfills `roundWinnerId` on existing rounds with a deterministic heuristic so we never have a `Round` missing the field on disk:

- For each existing round, the winner = the player whose `phaseStatus === "completed"` AND whose `score` is the unique minimum (Phase 10 convention: the player who goes out scores 0).
- If no completed player exists or there is a tie at the minimum, fall back to the round's first score's `playerId`. (This only affects pre-existing data; the field is required going forward.)

The migration is best-effort. The game flow was recently gutted (commit `4186ffa`), so production rounds are not expected, but the backfill is cheap insurance.

---

## 3. Component layout

All new code lives under `src/components/Scoreboard/`:

```
src/components/Scoreboard/
├── Scoreboard.tsx              # Top-level container. Owns expandedRound state + outside-click handler.
│                               # Renders the scrollable CSS Grid. Receives game, rounds, players as props.
├── ScoreboardHeader.tsx        # Empty top-left cell + per-player header cell (avatar + phase + tiebreaker).
├── RoundRow.tsx                # One completed round: round# cell + per-player PlayerResultCell.
│                               # Renders the expand container that mounts extra sub-rows when active.
├── GhostRow.tsx                # Pending row: circled "+" + per-player PlayerResultCell variant="ghost".
│                               # Tapping anywhere opens AddRoundDialog. Rendered only when game.status==="active".
├── PlayerResultCell.tsx        # Shared cell renderer. Props: { score?, isDealer, isRoundWinner, variant,
│                               #                                 expandedExtras? }.
├── AddRoundDialog.tsx          # Headless UI Dialog wrapper around AddRoundForm. Opened by GhostRow.
├── AddRoundForm.tsx            # Unstyled TanStack Form. Per-player score + phaseStatus + roundWinnerId picker.
│                               # On submit calls roundsApi.add via useAddRound mutation. Closes the dialog.
├── scoreboardUtils.ts          # Pure helpers — see §6.
└── index.ts                    # Barrel.
```

Conventions followed: `src/components/<Feature>/<Component>.tsx`; barrel export; `PlayerResultCell` is the single cell renderer reused by completed + ghost rows.

### 3.1 Data wiring

- New hook `useRounds(gameId)` in `src/data/hooks/useRounds.ts` returning `queryOptions` + a `useAddRound(gameId)` mutation that invalidates the rounds list and the game detail. Query key factory mirrors `useGames.ts`.
- `useRounds` query key: `["rounds", "list", gameId]`.
- `Game.tsx` (the existing route component) fetches `game` (already does), then fetches `rounds` and `players` (all players in `game.players`), and passes them into `<Scoreboard game={game} rounds={rounds} players={players} />`. No data fetching inside `Scoreboard` — props in, presentation out.

---

## 4. Visual / layout strategy (Approach A — CSS Grid + sticky)

A single scroll container with one CSS Grid inside.

```css
.scoreboard {
  display: grid;
  grid-template-columns: 36px repeat(var(--player-count), minmax(70px, 1fr));
  /* Each "row" is a sub-grid contributed by header / RoundRow / GhostRow via display: contents */
}
.scoreboard-cell { /* every cell */ }
.scoreboard-cell--sticky-top { position: sticky; top: 0; z-index: 2; }
.scoreboard-cell--sticky-left { position: sticky; left: 0; z-index: 1; }
.scoreboard-cell--sticky-corner { position: sticky; top: 0; left: 0; z-index: 3; }
```

Container element:

```tsx
<div className="overflow-auto"> {/* the scroll container */}
  <div className="scoreboard" style={{ "--player-count": players.length }}>
    {/* header cells, then row cells, then ghost cells, then add-round button cell */}
  </div>
</div>
```

- Header row is `position: sticky; top: 0` — stays put on vertical scroll.
- First column (round-numbers + the top-left empty cell + the ghost-row "+") is `position: sticky; left: 0` — stays put on horizontal scroll.
- When player count ≤ ~4, the grid fits within the container and there is no horizontal scroll. With more players (or a narrow screen), the player columns honor their 70px minimum and the container scrolls horizontally; the round-number column stays anchored.
- Outer border + 12px radius on `.scoreboard`. Internal cell borders via `border-bottom` + `border-right` on every cell with the existing `--color-pt-border` token (instead of 0.5px from the POC — we use 1px to match the rest of the app).
- Dashed borders on the ghost row use `border-style: dashed` on the cells in that row.

Accessibility: the grid root gets `role="table"`. Each row group (header, each round, ghost) wraps cells in `role="row"`. Cells get `role="cell"` or `role="columnheader"` as appropriate. Tapping a row uses `<button>` semantics nested in the cell or a single row-level `role="button"` with keyboard handlers — see §5.3.

---

## 5. Behavior

### 5.1 Header row

Per player, top to bottom (using existing `PlayerAvatar` for the identity element rather than the POC's hand-tinted pill):

1. `<PlayerAvatar player={player} variant="icon-initials" size={16} />`
2. Current phase as `text-2xl font-medium leading-none`. The current phase = the `currentPhase` for that player in the most recent round, or `1` if no rounds yet. Computed by `getCurrentPhase(player, rounds, totalPhases)`.
3. Tiebreaker value as `text-text-secondary text-xs`, formatted via `formatTiebreaker(value, tiebreaker)` (see §6).

### 5.2 Completed round row

Per cell:

- **Dealer chip** (absolute left-center): shown only if `getDealerId(round.roundNumber, game.activePlayers) === player.id`. 15×15px circle, amber `#FAC775` bg, `D` label `#412402`, 9px font, weight 500.
- **Phase number** (centered, `text-base font-medium leading-none`): color depends on `score.phaseStatus`:
  | status | text color | icon |
  |---|---|---|
  | `completed` | `#27500A` (dark green) | ✓ `#3B6D11` |
  | `failed` | `#A32D2D` (dark red) | ✕ `#A32D2D` |
  | `skipped` | `#B45309` (amber-700) | ⤴ `#B45309` |
  | `satOut` | `text-text-secondary` (theme token) | — `text-text-secondary` |
  The pass-color stays the same in dark mode (these are the spec colors); the satOut row uses theme tokens so it adapts.
- **Round-winner circle**: if `round.roundWinnerId === player.id`, wrap the phase number in a `1px solid currentColor` round border (or a tiny SVG circle). Implemented via a `::before` pseudo-element on the phase-number span: a 24×24 px ring positioned absolutely behind it.
- **Status icon** (absolute right-center, `text-xs`).

### 5.3 Row expansion

State at the Scoreboard level: `expandedRound: number | null`.

- Default: `null` (no rows expanded).
- Click an unfocused row → set `expandedRound = round.roundNumber`.
- Click the focused row → set `expandedRound = null`.
- Click anywhere outside `.scoreboard` → set `expandedRound = null`. Implemented with a `document.addEventListener("mousedown", …)` effect that ignores events inside the scoreboard ref.
- Only one row may be expanded at a time (single-valued state guarantees this).

Expanded cells render two extra sub-rows below the existing content (inside the cell):

1. Per-round tiebreaker contribution, formatted via `formatTiebreaker(value, tiebreaker)`.
2. Running tiebreaker total through this round, formatted the same way.

Both extra sub-rows fade in from opacity 0 → 1 over 200ms and the cell's height grows. Implementation:

- Each cell is a flex column. The two extra sub-rows live in a wrapper div that animates `grid-template-rows: 0fr → 1fr` (a known reliable height-from-zero CSS trick) and `opacity: 0 → 1` over 200ms.
- Per the codebase convention (memory: "Use specific transition utilities on `.glass` elements"), we use `transition-[grid-template-rows,opacity]` rather than bare `transition`.

Row clickability: each row is one big click target. To keep accessibility working we render the row's cells inside a `<div role="row">` that has `onClick` + `onKeyDown` (Enter / Space) handlers and `tabIndex={0}`. Cells themselves remain non-interactive (no nested buttons inside the row button). The cells use `pointer-events: none` for inner text, allowing the click to bubble to the row.

### 5.4 Ghost row (pending round)

- Top + internal borders are 1.5px dashed `--color-pt-border-secondary` (an existing token or close equivalent). Solid borders elsewhere remain 1px.
- Round-# cell contains a 20×20px circle border with a `+` centered inside.
- Per-player cells display the phase number that player will attempt next (`getCurrentPhase(player, rounds, totalPhases)` — same value as the header). No status icon. ~55% opacity content via `opacity-60` on the cell content wrapper.
- Dealer chip in the cell whose player is the *next* dealer (round number `rounds.length + 1`). Rendered with 60% opacity.
- The whole ghost row is one click target; tapping opens `AddRoundDialog`.
- Rendered **only** when `game.status === "active"`. (A completed game shows just header + body.)

### 5.5 Score entry placeholder (`AddRoundForm` + `AddRoundDialog`)

- Opens as a Headless UI `Dialog` from the bottom of the screen (the existing `Dialog` UI primitive — confirm position on implementation; if it's centered today, accept that for the placeholder).
- TanStack Form. No styling beyond what comes from base HTML inputs. Convention: every form in this codebase uses TanStack Form.
- Fields:
  - Per player in `game.activePlayers`: `score` (`<input type="number">`, default 0), `phaseStatus` (`<select>` of `completed | failed | skipped | satOut`, default `failed`).
  - `roundWinnerId`: a `<select>` listing only players whose `phaseStatus === "completed"` in the form's current state. If none, the form is invalid and submit is disabled with an inline error: "At least one player must complete their phase".
- Submit → `useAddRound.mutateAsync({ gameId, scores, roundWinnerId })` → close dialog → TanStack Query invalidation refreshes the scorecard.
- Cancel → close dialog without writing.

The placeholder form is explicitly scoped down — no dealer field (rotation), no wilds field (out of scope), no inline validation beyond "winner must be a completed player".

---

## 6. Pure helpers (`scoreboardUtils.ts`)

All pure functions. No React imports. Each documented with a JSDoc that includes the data it depends on.

```ts
/** Returns the player id whose turn it is to deal round N (1-indexed). */
export function getDealerId(roundNumber: number, activePlayers: PlayerId[]): PlayerId;

/** Player's current phase = currentPhase from the most recent round, or 1 if none. Clamped to totalPhases. */
export function getCurrentPhase(playerId: PlayerId, rounds: Round[], totalPhases: number): number;

/** Per-round tiebreaker contribution for one player. fewestWilds falls back to score (no data). */
export function getTiebreakerValue(round: Round, playerId: PlayerId, tiebreaker: GameTiebreaker): number;

/** Sum of per-round contributions across rounds [0..N], inclusive. */
export function getRunningTiebreakerTotal(
  rounds: Round[],
  playerId: PlayerId,
  tiebreaker: GameTiebreaker,
  throughRoundNumber: number,
): number;

/** Format a tiebreaker value with units. E.g. (43, "lowestPoints") -> "43 pts". */
export function formatTiebreaker(value: number, tiebreaker: GameTiebreaker): string;
```

Tiebreaker → per-round value mapping:

| `tiebreaker` | Per-round value | Unit |
|---|---|---|
| `lowestPoints` / `highestPoints` | `score.score` | `pts` |
| `fewestSkips` / `mostSkipped` | `score.phaseStatus === "skipped" ? 1 : 0` | `skips` |
| `roundsWon` | `round.roundWinnerId === playerId ? 1 : 0` | `won` |
| `fewestWilds` | `score.score` (fallback) | `pts` |

There is no test framework. Helpers are simple and exercised end-to-end through the rendered scorecard.

---

## 7. Open follow-ups (explicitly out of scope)

- Wilds tracking on `RoundScore` (required to make `fewestWilds` truly functional). Currently falls back to points.
- Polished score-entry UX (slide-up sheet, per-player live validation, large touch targets, phase-by-phase chip selector). Placeholder form is intentional.
- Editing a round / changing the winner of a round.
- Game-over / winner-screen UI.
- Sticky bottom for the ghost row.

---

## 8. Non-goals

- No new dependencies.
- No changes to existing UI primitives.
- No test scaffolding (project has none today).
- No new analytics, no new routes.
