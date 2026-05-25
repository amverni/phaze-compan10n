# Swipeable Tab Panels Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a shared touch-only `SwipeableTabPanels` carousel wrapper and use it for Add Round, Create Game, and Phase management tabs.

**Architecture:** Add one focused UI primitive that replaces Headless UI's `TabPanels` at call sites while keeping Headless UI `TabPanel` children. The primitive owns touch gesture recognition, horizontal track translation, edge resistance, snap animations, and inactive-panel accessibility; callers continue to own `selectedIndex` and tab rendering.

**Tech Stack:** React 19, TypeScript, Headless UI Tabs, Tailwind CSS v4 utility classes, native touch listeners with `passive: false` for claimed horizontal gestures, Biome via `npm run lint`, TypeScript/Vite via `npm run build`.

---

## File Structure

- Create `src/components/ui/SwipeableTabPanels/SwipeableTabPanels.tsx`
  - Single responsibility: render a Headless UI tab-panel container as a horizontally swipeable track.
  - Public interface: `selectedIndex`, `onChange`, `children`, optional `className`, and standard div props needed by current callers.
  - Internal responsibilities: child counting, cloning `TabPanel` children with `static`, touch gesture state, transform state, reduced-motion handling, resize tracking, inactive-slot `inert`/`aria-hidden`.
- Modify `src/components/ui/index.ts`
  - Barrel export for the new primitive.
- Modify `src/components/Create/CreateGame.tsx`
  - Replace Headless `TabPanels` import/usage with `SwipeableTabPanels`.
- Modify `src/components/Phases/Phases.tsx`
  - Convert `TabGroup` to controlled mode and replace Headless `TabPanels` with `SwipeableTabPanels`.
- Modify `src/components/Scoreboard/AddRoundDialog.tsx`
  - Remove local end-of-gesture swipe refs/constants/handlers.
  - Remove overlaid previous/next chevrons.
  - Replace Headless `TabPanels` with `SwipeableTabPanels`.
  - Keep the score wheel's existing `data-swipe-navigation-ignore` behavior intact through the shared primitive.

---

## Chunk 1: Shared `SwipeableTabPanels` primitive

### Task 1: Create the shared component

**Files:**
- Create: `src/components/ui/SwipeableTabPanels/SwipeableTabPanels.tsx`
- Modify: `src/components/ui/index.ts`

- [ ] **Step 1: Add the component file with its public interface**

Create `src/components/ui/SwipeableTabPanels/SwipeableTabPanels.tsx` with:

```tsx
import { TabPanels as HeadlessTabPanels } from "@headlessui/react";
import {
  Children,
  cloneElement,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

interface SwipeableTabPanelsProps extends ComponentPropsWithoutRef<"div"> {
  selectedIndex: number;
  onChange: (nextIndex: number) => void;
  children: ReactNode;
}
```

Expected: the file compiles once the component is completed in later steps.

- [ ] **Step 2: Add gesture constants and helper types**

Use fixed constants from the approved spec:

```tsx
const SWIPE_COMMIT_DISTANCE_PX = 50;
const HORIZONTAL_DOMINANCE_RATIO = 2;
const INTENT_DISTANCE_PX = 8;
const EDGE_RESISTANCE = 3;
const SNAP_TRANSITION_MS = 200;
const SWIPE_NAVIGATION_IGNORE_SELECTOR = "[data-swipe-navigation-ignore]";

type GestureMode = "pending" | "dragging" | "cancelled";

interface GestureState {
  id: number;
  startX: number;
  startY: number;
  mode: GestureMode;
}
```

- [ ] **Step 3: Implement reduced-motion and resize tracking**

Inside the component:

```tsx
const [containerElement, setContainerElement] = useState<HTMLDivElement | null>(null);
const [containerWidth, setContainerWidth] = useState(0);
const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

useLayoutEffect(() => {
  if (!containerElement) return;

  const updateWidth = () => setContainerWidth(containerElement.clientWidth);
  updateWidth();

  if (typeof ResizeObserver === "undefined") {
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }

  const observer = new ResizeObserver(updateWidth);
  observer.observe(containerElement);
  return () => observer.disconnect();
}, [containerElement]);

useEffect(() => {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  const update = () => setPrefersReducedMotion(query.matches);
  update();
  query.addEventListener("change", update);
  return () => query.removeEventListener("change", update);
}, []);
```

Expected: the track can calculate pixel transforms from the container width and can skip snap animation when reduced motion is active.

- [ ] **Step 4: Implement track state and external selection reset**

Add:

```tsx
const [visualIndex, setVisualIndex] = useState(selectedIndex);
const [dragOffset, setDragOffset] = useState(0);
const [transitionEnabled, setTransitionEnabled] = useState(false);
const gestureRef = useRef<GestureState | null>(null);
const swipeCommitTargetRef = useRef<number | null>(null);

useEffect(() => {
  if (swipeCommitTargetRef.current === selectedIndex) {
    swipeCommitTargetRef.current = null;
    return;
  }

  gestureRef.current = null;
  setTransitionEnabled(false);
  setDragOffset(0);
  setVisualIndex(selectedIndex);
}, [selectedIndex]);
```

Expected: tab taps and programmatic multi-tab jumps show the selected panel immediately and cancel stale drag state.

- [ ] **Step 5: Implement native touch listeners**

Attach listeners in an effect on `containerElement`:

```tsx
useEffect(() => {
  if (!containerElement) return;
  const panelCount = Children.count(children);

  const shouldIgnoreTarget = (target: EventTarget | null) =>
    target instanceof Element &&
    target.closest(SWIPE_NAVIGATION_IGNORE_SELECTOR) !== null;

  const finishSwipe = (deltaX: number) => {
    gestureRef.current = null;
    const direction = deltaX < 0 ? 1 : -1;
    const nextIndex = selectedIndex + direction;
    const canMove = nextIndex >= 0 && nextIndex < panelCount;
    const shouldCommit = Math.abs(deltaX) >= SWIPE_COMMIT_DISTANCE_PX && canMove;

    setTransitionEnabled(!prefersReducedMotion);
    setDragOffset(0);

    if (!shouldCommit) {
      setVisualIndex(selectedIndex);
      return;
    }

    swipeCommitTargetRef.current = nextIndex;
    setVisualIndex(nextIndex);
    onChange(nextIndex);
  };

  const onTouchStart = (event: TouchEvent) => {
    if (panelCount <= 1 || event.touches.length !== 1 || shouldIgnoreTarget(event.target)) {
      gestureRef.current = null;
      return;
    }

    const touch = event.touches[0];
    gestureRef.current = {
      id: touch.identifier,
      startX: touch.clientX,
      startY: touch.clientY,
      mode: "pending",
    };
    setTransitionEnabled(false);
  };

  const onTouchMove = (event: TouchEvent) => {
    const gesture = gestureRef.current;
    if (!gesture) return;
    if (event.touches.length !== 1) {
      gesture.mode = "cancelled";
      setDragOffset(0);
      return;
    }

    const touch = Array.from(event.touches).find((item) => item.identifier === gesture.id);
    if (!touch) return;

    const deltaX = touch.clientX - gesture.startX;
    const deltaY = touch.clientY - gesture.startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (gesture.mode === "pending") {
      if (absX < INTENT_DISTANCE_PX && absY < INTENT_DISTANCE_PX) return;
      if (absX < absY * HORIZONTAL_DOMINANCE_RATIO) {
        gesture.mode = "cancelled";
        return;
      }
      gesture.mode = "dragging";
    }

    if (gesture.mode !== "dragging") return;

    event.preventDefault();
    const atFirst = selectedIndex <= 0 && deltaX > 0;
    const atLast = selectedIndex >= panelCount - 1 && deltaX < 0;
    setDragOffset(atFirst || atLast ? deltaX / EDGE_RESISTANCE : deltaX);
  };

  const onTouchEnd = (event: TouchEvent) => {
    const gesture = gestureRef.current;
    if (!gesture) return;
    if (gesture.mode !== "dragging") {
      gestureRef.current = null;
      setDragOffset(0);
      return;
    }

    const touch = Array.from(event.changedTouches).find((item) => item.identifier === gesture.id);
    if (!touch) {
      gestureRef.current = null;
      setDragOffset(0);
      return;
    }

    finishSwipe(touch.clientX - gesture.startX);
  };

  const onTouchCancel = () => {
    gestureRef.current = null;
    setTransitionEnabled(!prefersReducedMotion);
    setDragOffset(0);
    setVisualIndex(selectedIndex);
  };

  containerElement.addEventListener("touchstart", onTouchStart, { passive: true });
  containerElement.addEventListener("touchmove", onTouchMove, { passive: false });
  containerElement.addEventListener("touchend", onTouchEnd, { passive: true });
  containerElement.addEventListener("touchcancel", onTouchCancel, { passive: true });

  return () => {
    containerElement.removeEventListener("touchstart", onTouchStart);
    containerElement.removeEventListener("touchmove", onTouchMove);
    containerElement.removeEventListener("touchend", onTouchEnd);
    containerElement.removeEventListener("touchcancel", onTouchCancel);
  };
}, [children, containerElement, onChange, prefersReducedMotion, selectedIndex]);
```

Expected: horizontal gestures are claimed only after clear horizontal intent; vertical gestures remain native; edge swipes resist; threshold is fixed at 50px.

- [ ] **Step 6: Render mounted panel slots with accessibility isolation**

Render:

```tsx
const panels = Children.toArray(children);
const transformX = -(visualIndex * containerWidth) + dragOffset;
const mergedClassName = [
  "overflow-x-hidden",
  className,
].filter(Boolean).join(" ");

return (
  <HeadlessTabPanels {...props} ref={setContainerElement} className={mergedClassName}>
    <div
      className="flex min-h-full will-change-transform"
      style={{
        transform: `translate3d(${transformX}px, 0, 0)`,
        transition:
          transitionEnabled && !prefersReducedMotion
            ? `transform ${SNAP_TRANSITION_MS}ms ease-out`
            : "none",
      }}
      onTransitionEnd={() => setTransitionEnabled(false)}
    >
      {panels.map((panel, index) => (
        <div
          key={isValidElement(panel) ? panel.key : index}
          className="min-h-full w-full min-w-full shrink-0"
          inert={index !== selectedIndex ? true : undefined}
          aria-hidden={index !== selectedIndex}
        >
          {isValidElement(panel)
            ? cloneElement(panel as ReactElement<{ static?: boolean }>, { static: true })
            : panel}
        </div>
      ))}
    </div>
  </HeadlessTabPanels>
);
```

Expected: every panel remains mounted for carousel visibility, but inactive slots cannot receive focus and are hidden from assistive tech.

- [ ] **Step 7: Export the component**

Modify `src/components/ui/index.ts`:

```ts
export { SwipeableTabPanels } from "./SwipeableTabPanels/SwipeableTabPanels";
```

- [ ] **Step 8: Run focused validation**

Run:

```bash
npm run lint
npm run build
```

Expected: both commands exit 0. Existing Biome schema-version info may appear; no lint errors.

- [ ] **Step 9: Commit the shared primitive**

Run:

```bash
git add src/components/ui/SwipeableTabPanels/SwipeableTabPanels.tsx src/components/ui/index.ts
git commit -m "Add swipeable tab panels primitive" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Chunk 2: Integrate Create Game and Phases tabs

### Task 2: Replace non-dialog tab panels with the shared primitive

**Files:**
- Modify: `src/components/Create/CreateGame.tsx`
- Modify: `src/components/Phases/Phases.tsx`

- [ ] **Step 1: Update Create Game imports**

Change:

```tsx
import { Tab, TabGroup, TabPanel, TabPanels } from "@headlessui/react";
import { Button, ScrollFade, TabList } from "../ui";
```

to:

```tsx
import { Tab, TabGroup, TabPanel } from "@headlessui/react";
import { Button, ScrollFade, SwipeableTabPanels, TabList } from "../ui";
```

- [ ] **Step 2: Replace Create Game `TabPanels`**

Change:

```tsx
<TabPanels className="content-container w-full min-h-0 flex-1">
```

to:

```tsx
<SwipeableTabPanels
  selectedIndex={selectedIndex}
  onChange={setSelectedIndex}
  className="content-container w-full min-h-0 flex-1"
>
```

and close it with `</SwipeableTabPanels>`.

Expected: Create Game's existing controlled `selectedIndex` drives both tab taps and touch swipes.

- [ ] **Step 3: Update Phases imports**

Change:

```tsx
import { Tab, TabGroup, TabPanel, TabPanels } from "@headlessui/react";
```

to:

```tsx
import { Tab, TabGroup, TabPanel } from "@headlessui/react";
import { useState } from "react";
```

and change the UI import:

```tsx
import { Button, SwipeableTabPanels, TabList } from "../ui";
```

- [ ] **Step 4: Convert Phases to controlled tabs**

Inside `Phases()` add:

```tsx
const [selectedIndex, setSelectedIndex] = useState(0);
```

Change:

```tsx
<TabGroup className="flex h-full min-h-0 flex-col">
```

to:

```tsx
<TabGroup
  selectedIndex={selectedIndex}
  onChange={setSelectedIndex}
  className="flex h-full min-h-0 flex-col"
>
```

- [ ] **Step 5: Replace Phases `TabPanels`**

Change:

```tsx
<TabPanels className="min-h-0 flex-1">
```

to:

```tsx
<SwipeableTabPanels
  selectedIndex={selectedIndex}
  onChange={setSelectedIndex}
  className="min-h-0 flex-1"
>
```

and close it with `</SwipeableTabPanels>`.

- [ ] **Step 6: Run focused validation**

Run:

```bash
npm run lint
npm run build
```

Expected: both commands exit 0.

- [ ] **Step 7: Commit non-dialog integrations**

Run:

```bash
git add src/components/Create/CreateGame.tsx src/components/Phases/Phases.tsx
git commit -m "Use swipeable panels for page tabs" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Chunk 3: Integrate Add Round and remove chevrons

### Task 3: Replace local Add Round swipe logic with the shared primitive

**Files:**
- Modify: `src/components/Scoreboard/AddRoundDialog.tsx`

- [ ] **Step 1: Update imports**

Change:

```tsx
import { Tab, TabGroup, TabPanel, TabPanels } from "@headlessui/react";
import { type TouchEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
```

to:

```tsx
import { Tab, TabGroup, TabPanel } from "@headlessui/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
```

Add `SwipeableTabPanels` to the existing `../ui` import list.

- [ ] **Step 2: Remove local swipe constants and state**

Delete:

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

Delete:

```tsx
const panelSwipeStartRef = useRef<PanelSwipeStart | null>(null);
```

- [ ] **Step 3: Remove local swipe handlers**

Delete these helpers from `AddRoundDialog`:

```tsx
const shouldIgnorePanelSwipeTarget = ...
const selectPanelSwipeTab = ...
const handlePanelTouchStart = ...
const handlePanelTouchMove = ...
const handlePanelTouchEnd = ...
const handlePanelTouchCancel = ...
```

Expected: Add Round no longer owns gesture recognition; the shared primitive handles it.

- [ ] **Step 4: Remove the previous/next chevrons**

Inside the body section, delete the two absolute blocks that render:

```tsx
<TabList.PrevButton ... />
<TabList.NextButton ... />
```

Keep the surrounding body container:

```tsx
<div className="relative flex min-h-0 flex-1">
```

Expected: the Add Round panel area gains the horizontal space previously reserved for chevrons.

- [ ] **Step 5: Replace Add Round `TabPanels`**

Change:

```tsx
<TabPanels
  className="-my-3 flex min-h-0 flex-1 flex-col overflow-y-auto px-8 py-3"
  onTouchStart={handlePanelTouchStart}
  onTouchMove={handlePanelTouchMove}
  onTouchEnd={handlePanelTouchEnd}
  onTouchCancel={handlePanelTouchCancel}
>
```

to:

```tsx
<SwipeableTabPanels
  selectedIndex={selectedIndex}
  onChange={setSelectedIndex}
  className="-my-3 min-h-0 flex-1 overflow-y-auto px-8 py-3"
>
```

and close it with `</SwipeableTabPanels>`.

Expected: Add Round cards follow the finger during horizontal drags and still allow vertical scrolling.

- [ ] **Step 6: Confirm the score wheel ignore marker still exists**

Check `src/components/ui/WheelSelector/WheelSelector.tsx` still includes:

```tsx
data-swipe-navigation-ignore
```

No code change is needed if it is already present.

- [ ] **Step 7: Run focused validation**

Run:

```bash
npm run lint
npm run build
```

Expected: both commands exit 0.

- [ ] **Step 8: Commit Add Round integration**

Run:

```bash
git add src/components/Scoreboard/AddRoundDialog.tsx
git commit -m "Use swipeable panels in add round" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Chunk 4: UI verification and final review

### Task 4: Verify carousel behavior

**Files:**
- Optional temporary artifact: `.playwright-artifacts/swipeable-tab-panels/verify.mjs`
- No committed source changes expected unless verification finds a bug.

- [ ] **Step 1: Run full static validation**

Run:

```bash
npm run lint
npm run build
```

Expected: both commands exit 0. Existing Vite chunk-size warning is acceptable; TypeScript or Biome errors are not.

- [ ] **Step 2: Start the app for touch-capable verification**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Expected: Vite starts and prints a local URL.

- [ ] **Step 3: Verify Create Game tabs manually or with Playwright**

Open `/` and navigate to the Create Game flow.

Expected:
- Dragging left/right on the setup panel content visibly translates the panel while the finger moves.
- Dragging less than 50px snaps back.
- Dragging at least 50px selects the adjacent tab.
- Tapping a tab still selects immediately.
- Vertical scrolling inside setup content remains usable.

- [ ] **Step 4: Verify Phase management tabs manually or with Playwright**

Open the Phases route.

Expected:
- The Phase Sets and Phases panels use the same swipe mechanics.
- First/last edge swipes resist and snap back without wrapping.
- Tapping each tab still selects normally.

- [ ] **Step 5: Verify Add Round tabs manually or with Playwright**

Open an active game, start Add Round, and use a touch-capable viewport.

Expected:
- The player card follows the finger during horizontal drags.
- Swipes commit only after 50px.
- Previous/next chevrons are gone.
- The Round Winner selector and action buttons remain usable.
- Dragging the score wheel does not change player tabs.
- Vertical scrolling in the panel still works.

- [ ] **Step 6: Verify inactive panel focus isolation**

Use keyboard Tab navigation after switching tabs.

Expected:
- Focusable controls in inactive panel slots are skipped.
- Focus remains in visible selected-panel content and surrounding dialog/page controls.

- [ ] **Step 7: Run code review**

Use the project `code-review` skill or fallback reviewer on the branch diff.

Expected: no blocking findings. If findings appear, fix them and repeat `npm run lint`, `npm run build`, and relevant UI checks.

- [ ] **Step 8: Commit verification fixes if needed**

If verification required source fixes, run:

```bash
git add <changed-source-files>
git commit -m "Fix swipeable panel verification issues" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

If no source fixes were needed, do not commit temporary `.playwright-artifacts` files.
