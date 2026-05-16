# Scorecard — Implementation Plan

Spec: `docs/superpowers/specs/2026-05-16-scorecard-design.md`

Tasks are ordered so each is independently reviewable and committable. Each task lists files touched, the work to do, and an acceptance check.

Validation per task: `npm run build` (TypeScript strict + Vite) and `npm run lint` (Biome). No test framework. Pre-existing lint error on `src/components/Players/PlayerEditor.tsx` is baseline and may be ignored.

---

## Task 1 — Add `roundWinnerId` to `Round` + data migration

**Files:**
- `src/types/round.ts` — add `roundWinnerId: PlayerId` to `Round`.
- `src/data/api/rounds.ts` — accept `roundWinnerId` in `add({...})`; store it on the new `Round`.
- `src/data/db/index.ts` — bump version 5 → 6; in `migrateRoundsStore` after the legacy migration, iterate existing rounds and backfill `roundWinnerId` using the heuristic in spec §2.3 (first `completed` player with unique minimum `score`, else first score's `playerId`). Apply on the new store as well as the put loop.
- `src/data/api/rounds.ts` — `edit` is unchanged (winner editing is a follow-up).

**Acceptance:**
- `npm run build` passes (TypeScript catches all consumers of `Round` / `roundsApi.add`).
- Existing callers updated (search for `roundsApi.add(` and update them — likely none after the gut commit).

---

## Task 2 — `useRounds` hook

**Files:**
- `src/data/hooks/useRounds.ts` (new) — `roundsKeys` factory, `roundsListOptions(gameId)`, `useAddRound(gameId)` mutation that calls `roundsApi.add` and invalidates `roundsKeys.list(gameId)` + the game detail key.
- Re-export in any barrel if one exists in `src/data/hooks/` (check; there isn't one today, so no barrel change needed).

**Acceptance:** `npm run build` passes; hook usable in `Game.tsx` next.

---

## Task 3 — Pure scoreboard helpers

**Files:**
- `src/components/Scoreboard/scoreboardUtils.ts` (new) — exports `getDealerId`, `getCurrentPhase`, `getTiebreakerValue`, `getRunningTiebreakerTotal`, `formatTiebreaker` per spec §6.

**Acceptance:**
- `npm run lint` clean.
- Each function has a one-paragraph JSDoc that names its inputs.
- `getCurrentPhase` clamps to `totalPhases`; defaults to 1 when there are no rounds.
- `getTiebreakerValue` for `fewestWilds` returns `score.score` (documented fallback).

---

## Task 4 — Scoreboard shell (grid + sticky + scroll)

**Files:**
- `src/components/Scoreboard/Scoreboard.tsx` (new) — props `{ game: ActiveGame | CompletedGame, rounds: Round[], players: Player[] }`. Renders a single `div.overflow-auto` with an inner CSS Grid root. Computes `playersById` map for cell-renderers. Owns `expandedRound` state + outside-click `mousedown` effect bound to the scoreboard ref.
- `src/components/Scoreboard/Scoreboard.module.css` — **do not use CSS Modules**; this project uses Tailwind + a small `index.css`. Instead, add the Scoreboard's grid-specific classes (`.scoreboard`, `.scoreboard-cell`, sticky modifiers, dashed-row modifier) to `src/components/Scoreboard/scoreboard.css` and import it from `Scoreboard.tsx`. This mirrors the `ScrollFade.tsx` + `Listbox.css` precedent.
- `src/components/Scoreboard/index.ts` (new) — barrel exporting `Scoreboard`.

**Acceptance:**
- The shell renders an empty grid that scrolls vertically when content exceeds height and horizontally when player count is large.
- The top-left corner cell, header cells, and round-# cells are sticky correctly (verified with placeholder cells in this task).

---

## Task 5 — `ScoreboardHeader`

**Files:**
- `src/components/Scoreboard/ScoreboardHeader.tsx` (new) — empty top-left cell + per-player header cell. Uses `PlayerAvatar` with `variant="icon-initials"`. Phase number via `getCurrentPhase`. Tiebreaker value via running total (= sum across all rounds) then `formatTiebreaker`.

**Acceptance:** Renders three stacked elements per player. Sticky-top works.

---

## Task 6 — `PlayerResultCell` (shared cell renderer)

**Files:**
- `src/components/Scoreboard/PlayerResultCell.tsx` (new) — props `{ score?: RoundScore, phaseNumber: number, isDealer: boolean, isRoundWinner: boolean, variant: "completed" | "ghost" }`.
- Renders the dealer chip (absolute left), centered phase number (colored by status, ringed if round-winner), absolute right status icon. `variant="ghost"` ⇒ no status icon, neutral color, ~55% opacity content, dealer chip at 60% opacity.
- Color/icon mapping per spec §5.2.

**Acceptance:** Lint clean. Pure presentation; no hooks beyond `useId` if needed.

---

## Task 7 — `RoundRow` + expansion animation

**Files:**
- `src/components/Scoreboard/RoundRow.tsx` (new) — props `{ round: Round, players: Player[], game: ActiveGame | CompletedGame, isExpanded: boolean, onToggle: () => void, allRounds: Round[] }`.
- Renders the round-# cell + a `PlayerResultCell` per player. Wraps cells in a `role="row" tabIndex={0}` clickable element with Enter/Space handling.
- Each cell mounts an "extras" wrapper (the two extra sub-rows: per-round tiebreaker contribution + running total). The wrapper uses `grid-template-rows: 0fr → 1fr` + `opacity` transitions over 200ms.

**Acceptance:**
- Click toggles expansion. Keyboard Enter/Space toggles. Outside click collapses (handled by parent).
- Animation works without layout jank.

---

## Task 8 — `GhostRow`

**Files:**
- `src/components/Scoreboard/GhostRow.tsx` (new) — renders only when `game.status === "active"`. Round-# cell = circled `+`. Per-player cell = `PlayerResultCell variant="ghost"` with the next phase. Dashed cell borders. Whole row is a click target opening `AddRoundDialog`.

**Acceptance:** Renders correctly with dashed borders; opens the dialog on tap.

---

## Task 9 — `AddRoundForm` + `AddRoundDialog` (placeholder)

**Files:**
- `src/components/Scoreboard/AddRoundDialog.tsx` (new) — wraps `AddRoundForm` in the existing `Dialog` UI primitive. Manages open/close via a prop.
- `src/components/Scoreboard/AddRoundForm.tsx` (new) — TanStack Form. Per-player fields + winner select + Submit/Cancel buttons. No styling beyond what's necessary to be usable. On submit calls `useAddRound`.
- Update `src/components/Scoreboard/Scoreboard.tsx` to own the `dialogOpen` state and render `AddRoundDialog` at the root.

**Acceptance:** Submitting the form adds a round, the new round appears in the body, the ghost row's phase numbers update, expansion still works.

---

## Task 10 — Wire `Scoreboard` into `Game` route + minor cleanup

**Files:**
- `src/components/Game/Game.tsx` — accept `gameId`, fetch `rounds` via `useQuery(roundsListOptions(gameId))` and the `players` via the existing `usePlayers` hook (look up by id; if `usePlayers` doesn't expose a by-ids helper, do a single fetch of all and filter — keep this trivial). Pass `game`, `rounds`, `players` into `<Scoreboard />`. Replace the "coming soon" placeholder with the Scoreboard inside `content-container`.
- Keep the back button in the footer; no other layout change.
- Confirm `image.png`, `Features.md`, `Review.md` untracked files at repo root remain untouched.

**Acceptance:**
- Visiting `/game/$gameId` for an active game shows the scorecard.
- `npm run build` + `npm run lint` pass.

---

## Task 11 — Visual verification (Playwright)

Owned by Phase 4 of the parent coding-team workflow. Captured here for completeness:

- `npm run preview` (after `npm run build`).
- Playwright sub-agent navigates to a seeded game, captures screenshots:
  1. Empty scorecard (no rounds).
  2. Scorecard with 2 completed rounds.
  3. Expanded row (tiebreaker + running total visible).
  4. 5-player game showing horizontal scroll with sticky round-# column.
  5. Dark mode of any of the above.
- Save to `.playwright-artifacts/scorecard/`. Add to `.gitignore` if missing.

---

## Risk register

- **DB version bump:** users in dev with existing version-5 data will run the migration on next load. Backfill is deterministic; no destructive change.
- **Sticky cells in CSS Grid:** Safari has been quirky historically. Mitigation: use the same simple `position: sticky` recipe the codebase already uses for `ScrollFade` and column-headers.
- **Outside-click handler firing on scroll-thumb drag:** use `mousedown` rather than `click`, scope to events with `target` outside the scoreboard ref. Don't preventDefault.
- **Click vs. select-text conflict on rows:** rows are not text-content, so this is unlikely to matter, but using `pointer-events: none` on cell inner content keeps things tidy.
