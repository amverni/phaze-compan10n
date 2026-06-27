# Compact Tiebreaker Buttons Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tighten the existing mini Phase 10 tiebreaker card buttons so the card row and wheel selector align fluidly and normally avoid horizontal scrolling.

**Architecture:** Keep the refinement local to `TiebreakerEntrySection.tsx` and `TiebreakerEntrySection.css`. The CSS continues to own cap geometry and accent variables; the TSX class constants own sizing, row alignment, and card/counter layout. No scoring, data, wheel behavior, accessibility labels, routing, or parent dialog behavior changes.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, existing `.glass` material classes, Biome, Vite.

---

## File structure

- Modify `src/components/Scoreboard/TiebreakerEntrySection.css`
  - Responsibility: compact cap geometry and reduced cap border prominence.
  - Boundaries: no global glass changes, no shared primitives.
- Modify `src/components/Scoreboard/TiebreakerEntrySection.tsx`
  - Responsibility: compact card sizing, row gap, vertical alignment between card bodies and `WheelSelector`, and unchanged button/counter semantics.
  - Boundaries: no scoring values, no `WheelSelector` prop changes, no Add Round parent changes.

## Chunk 1: Compact-fit tiebreaker card row

### Task 1: Slim the slanted cap geometry

**Files:**
- Modify: `src/components/Scoreboard/TiebreakerEntrySection.css:1-54`

- [ ] **Step 1: Reduce card cap geometry variables**

Change `.tiebreaker-quick-card` to use slimmer geometry:

```css
.tiebreaker-quick-card {
  --tiebreaker-card-accent: var(--color-text-secondary);
  --tiebreaker-card-cap-opacity: 0.12;
  --tiebreaker-card-slant: 0.55rem;
  --tiebreaker-card-inset-x: 0.2rem;
  --tiebreaker-card-inset-y: 0.2rem;
  --tiebreaker-card-cap-height: 28%;

  isolation: isolate;
}
```

Expected effect: slanted fills remain visible, but feel lighter and less boxy.

- [ ] **Step 2: Make selected cap treatment lighter**

Change:

```css
.tiebreaker-quick-card--selected {
  --tiebreaker-card-cap-opacity: 0.24;
}
```

Expected effect: Count selected state is still visible without making the card feel heavy.

- [ ] **Step 3: Reduce cap border prominence and radius**

In `.tiebreaker-quick-card__cap`, change the border from a full 1px solid accent to a subtler half-opacity border:

```css
border: 1px solid color-mix(in oklab, var(--tiebreaker-card-accent) 55%, transparent);
```

In `.tiebreaker-quick-card__cap--top`, change:

```css
border-radius: 0.5rem 0.5rem 0.15rem 0.15rem;
```

In `.tiebreaker-quick-card__cap--bottom`, change:

```css
border-radius: 0.15rem 0.15rem 0.5rem 0.5rem;
```

Expected effect: the colored cap border is thinner visually and the card reads slimmer.

- [ ] **Step 4: Validate CSS through the existing build**

Run:

```bash
npm run build
```

Expected: PASS. Biome does not process CSS in this repo, so CSS syntax is validated through Vite's build pipeline.

### Task 2: Compact the card row and card body

**Files:**
- Modify: `src/components/Scoreboard/TiebreakerEntrySection.tsx:83-94,167-245`

- [ ] **Step 1: Tighten the horizontal quick-button row**

Change `quickButtonRowClasses` from gap-2 to a tighter gap while keeping enough side padding for focus rings:

```ts
const quickButtonRowClasses = [
  "-mx-1 flex min-w-0 flex-nowrap gap-1.5 overflow-x-auto px-1 py-1",
].join(" ");
```

Expected effect: cards have less horizontal dead space from the smaller gap, while the 4px side padding still protects focus rings and card caps at scroll edges.

- [ ] **Step 2: Slim the card button body**

Change `quickCardButtonBaseClasses` so the card button is shorter, narrower, less padded, and less rounded:

```ts
const quickCardButtonBaseClasses = [
  "glass tiebreaker-quick-card relative inline-flex h-14 min-w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-bold leading-none",
  interactiveClasses,
  "transition-[filter,transform,opacity,background-color] duration-150 ease-out",
  "hover:brightness-110 active:scale-95",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
].join(" ");
```

Expected effect: four Points cards plus the wheel selector normally fit in the Add Round row without horizontal scrolling.

- [ ] **Step 3: Tighten selected styling**

In `getQuickCardButtonClasses`, change the selected class from a 2px ring to a slimmer 1px ring and less fill:

```ts
selected
  ? "tiebreaker-quick-card--selected bg-white/15! ring-1 ring-pt-blue-500/50 dark:bg-white/10!"
  : "",
```

Expected effect: Count selected card remains distinguishable without looking thicker than the rest of the row.

- [ ] **Step 4: Run targeted TSX/CSS check**

Run:

```bash
npx biome check src/components/Scoreboard/TiebreakerEntrySection.tsx src/components/Scoreboard/TiebreakerEntrySection.css
```

Expected: PASS for the TSX file. Biome may ignore the CSS file; CSS validation happens through `npm run build`.

### Task 3: Align the wheel selector to the card bodies

**Files:**
- Modify: `src/components/Scoreboard/TiebreakerEntrySection.tsx:167-245`

- [ ] **Step 1: Align Points row to card body center**

Change the Points row container from:

```tsx
<div className="flex w-full items-center justify-between gap-3">
```

to:

```tsx
<div className="flex w-full items-start justify-between gap-2">
```

Then change each Points button wrapper from:

```tsx
<div key={btn.id} className="flex shrink-0 flex-col items-center gap-1.5">
```

to:

```tsx
<div key={btn.id} className="flex shrink-0 flex-col items-center gap-1">
```

Finally wrap the Points `WheelSelector` in a top-aligned container:

```tsx
<div className="shrink-0 -mt-2">
  <WheelSelector
    value={value}
    onChange={onChange}
    min={variant.min}
    max={variant.max}
    step={variant.step}
    label={variant.label}
    disabled={disabled}
  />
</div>
```

Why `-mt-2`: the compact card body is `h-14` (56px), the quick row has `py-1` (4px top padding), and the wheel pill is `h-20` (80px). Moving the wheel up by 8px puts the wheel center at 32px from the control-row top, matching the card body's center at `4px + 28px`.

Expected effect: the wheel visually aligns with the card body rather than the card-plus-counter stack. The wheel may extend into the section's existing vertical gap above the controls, but it should not overlap the section label.

- [ ] **Step 2: Align Count row to the same control rhythm**

Change the Count row container from:

```tsx
<div className="flex w-full items-center justify-between gap-3">
```

to:

```tsx
<div className="flex w-full items-start justify-between gap-2">
```

Wrap the Count `WheelSelector` in the same top-aligned container:

```tsx
<div className="shrink-0 -mt-2">
  <WheelSelector
    value={value}
    onChange={onChange}
    min={variant.min}
    max={variant.max}
    step={variant.step}
    label={variant.label}
    disabled={disabled}
  />
</div>
```

Expected effect: Points and Count tiebreaker rows share the same card/wheel alignment. For Count rows, the same offset aligns the wheel with the compact card bodies even though there are no counters below the cards.

- [ ] **Step 3: Preserve behavior**

Confirm the following code remains unchanged:

- Points deltas: `+5 = 5`, `+10 = 10`, `Skip = 15`, `Wild = 25`
- Count quick buttons: `[1, 2, 3, 4, 5]`
- `onQuickIncrement(btn.id)`
- `onQuickSet`, `clampToMax`
- every `WheelSelector` prop
- `aria-label`, `aria-describedby`, `aria-pressed`, and counter sr-only text
- `disabled={disabled}` on quick buttons
- `aria-disabled={disabled || undefined}` on the section wrapper

- [ ] **Step 4: Run targeted check**

Run:

```bash
npx biome check src/components/Scoreboard/TiebreakerEntrySection.tsx src/components/Scoreboard/TiebreakerEntrySection.css
```

Expected: PASS for the TSX file. Biome may ignore the CSS file; CSS validation happens through `npm run build`.

- [ ] **Step 5: Confirm alignment math in the diff**

Before moving on, confirm the TSX still has:

- compact card height `h-14`,
- wheel wrappers `className="shrink-0 -mt-2"`,
- row containers `items-start`,
- Points counter gap `gap-1`.

Expected: the wheel center aligns with the padded 56px card body center instead of the card-plus-counter stack center.

### Task 4: Validate and commit

**Files:**
- Modify: `src/components/Scoreboard/TiebreakerEntrySection.tsx`
- Modify: `src/components/Scoreboard/TiebreakerEntrySection.css`

- [ ] **Step 1: Run full lint**

Run:

```bash
npm run lint
```

Expected: PASS. If lint fails on files outside `src/components/Scoreboard/TiebreakerEntrySection.*`, stop and report the unrelated blocker instead of fixing outside this task.

- [ ] **Step 2: Run full build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Inspect the UI when app state is available**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

If the local browser already has an active game available, open a game configured with a Points Tiebreaker and open Add Round. If no suitable game data exists, do not create unrelated setup flows in this task; record that visual inspection needs human/browser follow-up and rely on lint/build plus code review.

Expected:

- the four Points cards normally fit without horizontal scrolling,
- the cards are visibly thinner with smaller radius and lighter cap borders,
- the wheel selector aligns with the card bodies,
- counters remain below the cards,
- zero/non-zero counter styling still works.

Then inspect a Count Tiebreaker.

Expected:

- Count cards use the same compact shape,
- selected Count card remains visible but slimmer,
- wheel alignment matches the Points row,
- no Count counters appear.

Also inspect a skipped/sat-out player state if available.

Expected:

- the section wrapper still applies `aria-disabled`,
- quick buttons remain disabled,
- the wheel selector remains disabled,
- no tiebreaker value changes can be made from the disabled controls.

- [ ] **Step 4: Stop the dev server**

Stop the dev server with `Ctrl+C` or `stop_bash` if it was started through the Copilot CLI async shell.

- [ ] **Step 5: Review diff**

Run:

```bash
git --no-pager diff -- src/components/Scoreboard/TiebreakerEntrySection.tsx src/components/Scoreboard/TiebreakerEntrySection.css
```

Expected: only compact styling/layout changes in these two files. No scoring, data, route, hook, or parent dialog changes.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/components/Scoreboard/TiebreakerEntrySection.tsx src/components/Scoreboard/TiebreakerEntrySection.css
git commit -m "Tighten tiebreaker card button styling" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

Expected: commit succeeds with only the two implementation files staged.
