# Add Round Swipe Tabs Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add touch-only swipe navigation between player tabs in the add-round dialog.

**Architecture:** Keep the gesture handling local to `AddRoundDialog`, reusing its controlled Headless UI `TabGroup` state. Add a generic swipe-ignore marker to `WheelSelector` so score-wheel drags do not trigger tab navigation.

**Tech Stack:** React 19, TypeScript, Headless UI Tabs, Tailwind CSS v4, Biome, Vite.

---

## File Structure

- Modify: `src/components/Scoreboard/AddRoundDialog.tsx`
  - Owns add-round player tab selection and receives touch handlers on the `TabPanels` content scroll area.
  - Adds swipe constants, a touch-start ref, local gesture helpers, and `TabPanels` touch props.
- Modify: `src/components/ui/WheelSelector/WheelSelector.tsx`
  - Adds a data attribute to the existing wheel root so parent swipe navigation can ignore wheel-control gestures without coupling to CSS class names.
- No changes: data APIs, IndexedDB schema, routes, shared `TabList`, or generated route tree.

## Chunk 1: Add swipe navigation

### Task 1: Mark wheel selector as swipe-navigation ignored

**Files:**
- Modify: `src/components/ui/WheelSelector/WheelSelector.tsx:269-282`

- [ ] **Step 1: Add a data attribute to the wheel root**

In the root `<div>` returned by `WheelSelector`, add:

```tsx
data-swipe-navigation-ignore
```

Expected root shape:

```tsx
<div
  className={rootClasses}
  data-swipe-navigation-ignore
  role="spinbutton"
  aria-valuemin={min}
  aria-valuemax={max}
  aria-valuenow={value}
  aria-valuetext={`${value} ${label}`}
  aria-label={label}
  aria-disabled={disabled ? "true" : undefined}
  tabIndex={disabled ? -1 : 0}
  onKeyDown={handleKeyDown}
  style={{ "--wheel-selector-offset": `${dragOffset}px` } as React.CSSProperties}
>
```

- [ ] **Step 2: Verify the file still type-checks locally**

Run:

```bash
npm run build
```

Expected: `tsc -b && vite build` completes successfully. Existing Vite chunk-size warnings are acceptable.

### Task 2: Add local swipe gesture state and helpers

**Files:**
- Modify: `src/components/Scoreboard/AddRoundDialog.tsx:34-50`
- Modify: `src/components/Scoreboard/AddRoundDialog.tsx:137-148`

- [ ] **Step 1: Add local gesture constants and type**

Near the existing top-level constants, add:

```tsx
const PANEL_SWIPE_MIN_DISTANCE_PX = 50;
const PANEL_SWIPE_HORIZONTAL_DOMINANCE = 2;
const SWIPE_NAVIGATION_IGNORE_SELECTOR = "[data-swipe-navigation-ignore]";

interface PanelSwipeStart {
  id: number;
  x: number;
  y: number;
}
```

- [ ] **Step 2: Add a swipe-start ref inside `AddRoundDialog`**

Near the existing refs:

```tsx
const panelSwipeStartRef = useRef<PanelSwipeStart | null>(null);
```

- [ ] **Step 3: Add a target-ignore helper inside `AddRoundDialog`**

Place this near the other local handlers:

```tsx
const shouldIgnorePanelSwipeTarget = (target: EventTarget | null) =>
  target instanceof Element && target.closest(SWIPE_NAVIGATION_IGNORE_SELECTOR) !== null;
```

- [ ] **Step 4: Add a clamped tab setter helper inside `AddRoundDialog`**

Place this near the other local handlers:

```tsx
const selectPanelSwipeTab = (direction: -1 | 1) => {
  if (players.length <= 1) return;
  const maxIndex = players.length - 1;
  const nextIndex = Math.min(Math.max(selectedIndex + direction, 0), maxIndex);
  if (nextIndex === selectedIndex) return;
  setSelectedIndex(nextIndex);
};
```

### Task 3: Wire touch handlers to the tab panel scroll area

**Files:**
- Modify: `src/components/Scoreboard/AddRoundDialog.tsx:137-148`
- Modify: `src/components/Scoreboard/AddRoundDialog.tsx:284-354`

- [ ] **Step 1: Add the touch-start handler**

Place this near the other local handlers:

```tsx
const handlePanelTouchStart = (event: React.TouchEvent<HTMLElement>) => {
  if (
    players.length <= 1 ||
    event.touches.length !== 1 ||
    shouldIgnorePanelSwipeTarget(event.target)
  ) {
    panelSwipeStartRef.current = null;
    return;
  }

  const touch = event.touches[0];
  panelSwipeStartRef.current = {
    id: touch.identifier,
    x: touch.clientX,
    y: touch.clientY,
  };
};
```

- [ ] **Step 2: Add the touch-move reset handler**

Place this after `handlePanelTouchStart`:

```tsx
const handlePanelTouchMove = (event: React.TouchEvent<HTMLElement>) => {
  if (!panelSwipeStartRef.current) return;
  if (event.touches.length !== 1) {
    panelSwipeStartRef.current = null;
  }
};
```

- [ ] **Step 3: Add the touch-end handler**

Place this after `handlePanelTouchMove`:

```tsx
const handlePanelTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
  const start = panelSwipeStartRef.current;
  panelSwipeStartRef.current = null;
  if (!start) return;

  let touch: Touch | null = null;
  for (let index = 0; index < event.changedTouches.length; index += 1) {
    const changedTouch = event.changedTouches[index];
    if (changedTouch.identifier === start.id) {
      touch = changedTouch;
      break;
    }
  }
  if (!touch) return;

  const deltaX = touch.clientX - start.x;
  const deltaY = touch.clientY - start.y;
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  if (
    absX < PANEL_SWIPE_MIN_DISTANCE_PX ||
    absX < absY * PANEL_SWIPE_HORIZONTAL_DOMINANCE
  ) {
    return;
  }

  selectPanelSwipeTab(deltaX < 0 ? 1 : -1);
};
```

- [ ] **Step 4: Add the cancel handler**

Place this after `handlePanelTouchEnd`:

```tsx
const handlePanelTouchCancel = () => {
  panelSwipeStartRef.current = null;
};
```

- [ ] **Step 5: Attach handlers to `TabPanels`**

Update the existing `TabPanels` element:

```tsx
<TabPanels
  className="-my-3 flex min-h-0 flex-1 flex-col overflow-y-auto px-8 py-3"
  onTouchStart={handlePanelTouchStart}
  onTouchMove={handlePanelTouchMove}
  onTouchEnd={handlePanelTouchEnd}
  onTouchCancel={handlePanelTouchCancel}
>
```

Expected: Headless UI forwards the touch props to the rendered panel container. If TypeScript rejects the props or runtime inspection shows they are not forwarded, wrap `TabPanels` in a thin `<div>` with these handlers and preserve the current layout classes on the scroll element.

### Task 4: Validate and review the interaction

**Files:**
- Validate: `src/components/Scoreboard/AddRoundDialog.tsx`
- Validate: `src/components/ui/WheelSelector/WheelSelector.tsx`

- [ ] **Step 1: Run lint**

Run:

```bash
npm run lint
```

Expected: Biome completes successfully. Existing Biome schema-version informational output is acceptable if no errors are reported.

- [ ] **Step 2: Run build**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite build complete successfully. Existing Vite chunk-size warnings are acceptable.

- [ ] **Step 3: Perform touch UI verification**

Use a touch-capable browser viewport and verify:

- Horizontal swipes across the add-round panel body switch player tabs.
- Vertical swipes inside the panel scroll content do not switch tabs.
- Slow diagonal swipes at the top of the panel do not trigger both tab navigation and dialog dismissal.
- Dragging the wheel selector changes the score and does not switch tabs.
- Two-finger gestures do not switch tabs.
- Swiping right at the first tab and left at the last tab is a no-op.
- Swiping the tab strip itself scrolls the tab strip and does not trigger panel swipe navigation.

- [ ] **Step 4: Commit the implementation**

Run:

```bash
git add src/components/Scoreboard/AddRoundDialog.tsx src/components/ui/WheelSelector/WheelSelector.tsx
git commit -m "Add swipe navigation to add-round tabs" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```
