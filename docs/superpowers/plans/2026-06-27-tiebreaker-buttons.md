# Tiebreaker Buttons Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle Add Round tiebreaker quick buttons as horizontal mini Phase 10 cards with below-button counters for Points Tiebreakers.

**Architecture:** Keep the change local to the Scoreboard Add Round tiebreaker entry surface. `TiebreakerEntrySection.tsx` owns the render logic, metadata, accessibility wiring, and class composition; a sibling CSS file owns only the slanted-card cap geometry that is awkward to express safely with Tailwind utilities. No data APIs, hooks, IndexedDB schema, routing, or game-rule logic change.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, existing `.glass` material classes, Biome, Vite.

---

## File structure

- Create `src/components/Scoreboard/TiebreakerEntrySection.css`
  - Responsibility: local mini Phase 10 card cap styling for tiebreaker quick buttons.
  - Boundaries: no layout decisions beyond cap geometry; no global `.glass` changes; no shared UI primitive.
- Modify `src/components/Scoreboard/TiebreakerEntrySection.tsx`
  - Responsibility: tiebreaker variant resolution, quick-button metadata, rendering, button state, `aria-describedby` counter associations, and layout class composition.
  - Boundaries: no scoring-rule changes; no wheel selector changes; no parent dialog changes.

Known validation note: `npm run build` may fail on the current baseline with an unrelated `TS6133` unused-variable error in `src/components/Scoreboard/AddRoundDialog.tsx` for the player-tab `isWinner` variable. Do not fix unrelated baseline errors in this task unless explicitly authorized. If build fails, confirm no new errors point at `TiebreakerEntrySection.tsx` or `TiebreakerEntrySection.css`.

## Chunk 1: Mini-card tiebreaker quick buttons

### Task 1: Add local slanted-card CSS

**Files:**
- Create: `src/components/Scoreboard/TiebreakerEntrySection.css`

- [ ] **Step 1: Create the local CSS file**

Use `apply_patch` to add:

```css
.tiebreaker-quick-card {
  --tiebreaker-card-accent: var(--color-text-secondary);
  --tiebreaker-card-cap-opacity: 0.16;
  --tiebreaker-card-slant: 0.85rem;
  --tiebreaker-card-inset-x: 0.28rem;
  --tiebreaker-card-inset-y: 0.28rem;
  --tiebreaker-card-cap-height: 30%;

  isolation: isolate;
}

.tiebreaker-quick-card--blue {
  --tiebreaker-card-accent: var(--color-pt-blue-500);
}

.tiebreaker-quick-card--green {
  --tiebreaker-card-accent: var(--color-pt-green-500);
}

.tiebreaker-quick-card--yellow {
  --tiebreaker-card-accent: var(--color-pt-yellow-500);
}

.tiebreaker-quick-card--red {
  --tiebreaker-card-accent: var(--color-pt-red-500);
}

.tiebreaker-quick-card--selected {
  --tiebreaker-card-cap-opacity: 0.28;
}

.tiebreaker-quick-card__cap {
  position: absolute;
  left: var(--tiebreaker-card-inset-x);
  right: var(--tiebreaker-card-inset-x);
  z-index: 0;
  height: var(--tiebreaker-card-cap-height);
  border: 1px solid var(--tiebreaker-card-accent);
  background: var(--tiebreaker-card-accent);
  opacity: var(--tiebreaker-card-cap-opacity);
  pointer-events: none;
}

.tiebreaker-quick-card__cap--top {
  top: var(--tiebreaker-card-inset-y);
  border-radius: 0.85rem 0.85rem 0.3rem 0.3rem;
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - var(--tiebreaker-card-slant)), 0 100%);
}

.tiebreaker-quick-card__cap--bottom {
  bottom: var(--tiebreaker-card-inset-y);
  border-radius: 0.3rem 0.3rem 0.85rem 0.85rem;
  clip-path: polygon(0 var(--tiebreaker-card-slant), 100% 0, 100% 100%, 0 100%);
}
```

- [ ] **Step 2: Confirm the CSS uses repo styling conventions**

Check:

- Colors use existing theme variables (`--color-pt-*`, `--color-text-secondary`).
- No hardcoded hex/rgb color values are introduced.
- The CSS does not target `.glass::after`; caps are explicit child elements, avoiding the global glass shine pseudo-element conflict discovered in the prototype.

- [ ] **Step 3: Run targeted formatter/lint check for the new CSS**

Run:

```bash
npx biome check src/components/Scoreboard/TiebreakerEntrySection.css
```

Expected: PASS.

### Task 2: Update shared metadata and class helpers

**Files:**
- Modify: `src/components/Scoreboard/TiebreakerEntrySection.tsx`

- [ ] **Step 1: Import dependencies**

Add imports:

```ts
import { useId } from "react";
import { interactiveClasses } from "../ui/sharedClasses";
import "./TiebreakerEntrySection.css";
```

- [ ] **Step 2: Replace quick-button metadata types**

Replace the current `PointsQuickButton` interface and `POINTS_QUICK_BUTTONS` constant with:

```ts
type QuickButtonAccent = "blue" | "green" | "yellow" | "red";

interface PointsQuickButton {
  id: PointsQuickButtonId;
  label: string;
  delta: number;
  accent: QuickButtonAccent;
  counterClassName: string;
}

const POINTS_QUICK_BUTTONS: PointsQuickButton[] = [
  { id: "p5", label: "+5", delta: 5, accent: "blue", counterClassName: "text-pt-blue-500" },
  { id: "p10", label: "+10", delta: 10, accent: "green", counterClassName: "text-pt-green-500" },
  {
    id: "skipCard",
    label: "Skip",
    delta: 15,
    accent: "yellow",
    counterClassName: "text-pt-yellow-500",
  },
  { id: "wild", label: "Wild", delta: 25, accent: "red", counterClassName: "text-pt-red-500" },
];
```

- [ ] **Step 3: Replace the old Points circular button class constant**

Remove `quickButtonBaseClasses`. Keep `countButtonClasses` for now because the existing Count JSX still references it until Task 4. Add:

```ts
const quickButtonRowClasses = [
  "-mx-1 flex min-w-0 flex-nowrap gap-2 overflow-x-auto px-1 py-1",
].join(" ");

const quickCardButtonBaseClasses = [
  "glass tiebreaker-quick-card relative inline-flex h-[4.5rem] min-w-[3.75rem] shrink-0 items-center justify-center overflow-hidden rounded-2xl px-3 text-sm font-bold leading-none",
  interactiveClasses,
  "transition-[filter,transform,opacity,background-color] duration-150 ease-out",
  "hover:brightness-110 active:scale-95",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
].join(" ");

const quickCardAccentClasses: Record<QuickButtonAccent | "neutral", string> = {
  blue: "tiebreaker-quick-card--blue",
  green: "tiebreaker-quick-card--green",
  yellow: "tiebreaker-quick-card--yellow",
  red: "tiebreaker-quick-card--red",
  neutral: "",
};
```

- [ ] **Step 4: Add local helper functions**

Add these helpers below the class constants:

```ts
function getQuickCardButtonClasses({
  accent,
  selected = false,
}: {
  accent: QuickButtonAccent | "neutral";
  selected?: boolean;
}): string {
  return [
    quickCardButtonBaseClasses,
    quickCardAccentClasses[accent],
    selected ? "tiebreaker-quick-card--selected bg-white/25! ring-2 ring-pt-blue-500/50 dark:bg-white/10!" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function getCounterDescription(count: number): string {
  return `Used ${count} ${count === 1 ? "time" : "times"}`;
}

function QuickCardCaps() {
  return (
    <>
      <span aria-hidden className="tiebreaker-quick-card__cap tiebreaker-quick-card__cap--top" />
      <span
        aria-hidden
        className="tiebreaker-quick-card__cap tiebreaker-quick-card__cap--bottom"
      />
    </>
  );
}
```

- [ ] **Step 5: Defer the TypeScript/Biome check until helpers are consumed**

Do not run `biome check` yet. At this point, the new import, class constants, and helper functions are intentionally unused until Tasks 3 and 4 replace the JSX. Running the check now would create false failures from unused symbols.

### Task 3: Render Points Tiebreaker mini-cards with external counters

**Files:**
- Modify: `src/components/Scoreboard/TiebreakerEntrySection.tsx`

- [ ] **Step 1: Add a stable counter ID base before the hidden return**

Inside `TiebreakerEntrySection`, immediately after `const variant = resolveVariant(tiebreaker);` and before `if (variant.kind === "hidden")`, add:

```ts
const counterIdBase = useId();
```

This hook must stay before the conditional `hidden` return so React hook order and Biome's hook rules remain valid.

- [ ] **Step 2: Replace the Points quick-button grid**

Replace the current `variant.kind === "points"` quick-button group whose container is `<div className="grid grid-cols-2 gap-2">`.

with:

```tsx
<div className={quickButtonRowClasses}>
  {POINTS_QUICK_BUTTONS.map((btn) => {
    const count = quickCounts[btn.id];
    const counterId = `${counterIdBase}-${btn.id}`;
    return (
      <div key={btn.id} className="flex shrink-0 flex-col items-center gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onQuickIncrement(btn.id)}
          className={getQuickCardButtonClasses({ accent: btn.accent })}
          aria-label={`Add ${btn.delta} points (${btn.label})`}
          aria-describedby={counterId}
        >
          <QuickCardCaps />
          <span className="relative z-10 text-text-primary">{btn.label}</span>
        </button>
        <span
          id={counterId}
          className={[
            "text-xs font-bold leading-none tabular-nums",
            count > 0 ? btn.counterClassName : "text-text-secondary opacity-60",
          ].join(" ")}
        >
          <span aria-hidden>{count}</span>
          <span className="sr-only">{getCounterDescription(count)}</span>
        </span>
      </div>
    );
  })}
</div>
```

- [ ] **Step 3: Preserve the surrounding row contract**

Keep the existing outer Points row container: `<div className="flex w-full items-center justify-between gap-3">`. Do not change the existing Points `WheelSelector` props.

Expected result: quick buttons remain left of the wheel selector in the same row; only the quick-button group scrolls horizontally when constrained.

- [ ] **Step 4: Run targeted check**

Run:

```bash
npx biome check src/components/Scoreboard/TiebreakerEntrySection.tsx src/components/Scoreboard/TiebreakerEntrySection.css
```

Expected: PASS.

### Task 4: Render Count Tiebreaker mini-cards with selected state

**Files:**
- Modify: `src/components/Scoreboard/TiebreakerEntrySection.tsx`

- [ ] **Step 1: Replace the Count quick-button flex-wrap row and remove the old Count class**

Replace the existing Count quick-button group whose container is `<div className="flex flex-wrap gap-2">` and whose buttons currently use `className={countButtonClasses}`.

with:

```tsx
<div className={quickButtonRowClasses}>
  {COUNT_QUICK_BUTTONS.map((n) => {
    const selected = value === n;
    return (
      <button
        key={n}
        type="button"
        disabled={disabled}
        onClick={() => onQuickSet(n)}
        className={getQuickCardButtonClasses({
          accent: selected ? "blue" : "neutral",
          selected,
        })}
        aria-label={`Set to ${n}`}
        aria-pressed={selected}
      >
        <QuickCardCaps />
        <span className="relative z-10 text-text-primary">{n}</span>
      </button>
    );
  })}
</div>
```

After this JSX replacement, remove the now-unused `countButtonClasses` constant.

- [ ] **Step 2: Preserve Count row and wheel selector behavior**

Keep the surrounding Count row container: `<div className="flex w-full items-center justify-between gap-3">`. Do not change the existing Count `WheelSelector` props.

Do not change `onQuickSet`, `clampToMax`, `WheelSelector`, `min`, `max`, `step`, or `disabled` wiring.

- [ ] **Step 3: Run targeted check**

Run:

```bash
npx biome check src/components/Scoreboard/TiebreakerEntrySection.tsx src/components/Scoreboard/TiebreakerEntrySection.css
```

Expected: PASS.

### Task 5: Validate, inspect, and commit

**Files:**
- Modify: `src/components/Scoreboard/TiebreakerEntrySection.tsx`
- Create: `src/components/Scoreboard/TiebreakerEntrySection.css`

- [ ] **Step 1: Run repository lint**

Run:

```bash
npm run lint
```

Expected: PASS, or only unrelated pre-existing issues outside `src/components/Scoreboard/TiebreakerEntrySection.*`. Fix any lint/format issues in touched files.

- [ ] **Step 2: Run repository build**

Run:

```bash
npm run build
```

Expected: PASS if the baseline unused-variable issue has already been fixed. If it fails with only the known unrelated `TS6133` error in `src/components/Scoreboard/AddRoundDialog.tsx`, record that as a pre-existing blocker and verify there are no errors in `TiebreakerEntrySection.tsx`.

- [ ] **Step 3: Manually inspect Points Tiebreaker UI**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Open an active game configured with `lowestPoints` or `highestPoints`, then open Add Round.

Expected:

- `+5`, `+10`, `Skip`, and `Wild` are vertical mini Phase 10 cards in one horizontal row.
- The wheel selector remains to the right of the quick-button row.
- Counters appear below each card, outside the button.
- Zero counters are muted; non-zero counters use the matching accent.
- The quick-button row scrolls horizontally instead of wrapping if the viewport is narrow.

- [ ] **Step 4: Manually inspect Count Tiebreaker UI**

Use a game configured with `fewestWilds`, `fewestSkips`, or `mostSkipped`.

Expected:

- `1`-`5` quick-set cards use the same mini-card shape.
- Count cards stay in one horizontal row beside the wheel selector.
- The selected value is highlighted with the blue selected treatment.
- No counters appear below Count cards.

- [ ] **Step 5: Manually inspect disabled state**

In Add Round, choose `Skipped` or `Sat Out` for a player.

Expected:

- The tiebreaker entry section keeps its current disabled opacity behavior.
- Quick buttons cannot be clicked.
- Wheel selector receives `disabled={true}` as before.

- [ ] **Step 6: Stop the dev server**

If the dev server is running in a foreground terminal, press `Ctrl+C`. If using the Copilot CLI bash tool in async mode, stop it with `stop_bash` using the shell ID from the command that started `npm run dev`.

- [ ] **Step 7: Review diff**

Run:

```bash
git --no-pager diff -- src/components/Scoreboard/TiebreakerEntrySection.tsx src/components/Scoreboard/TiebreakerEntrySection.css
```

Expected:

- Only tiebreaker button styling/layout/accessibility changed.
- No tiebreaker scoring values changed.
- No data-layer, hook, DB, route, or parent dialog files changed.

- [ ] **Step 8: Commit**

Run:

```bash
git add src/components/Scoreboard/TiebreakerEntrySection.tsx src/components/Scoreboard/TiebreakerEntrySection.css
git commit -m "Improve tiebreaker quick button cards" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

Expected: commit succeeds with only the two implementation files staged.
