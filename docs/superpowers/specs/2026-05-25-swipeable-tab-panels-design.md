# Swipeable Tab Panels Design

## Goal

Make tab panel changes feel like a carousel on touch devices. When a user swipes horizontally across a tab panel, the current panel should move with the finger and settle into the adjacent panel if the swipe crosses the commit distance. The existing tab-list active indicator already animates well, so this design changes only the panel/card behavior.

## Scope

- Add a shared `SwipeableTabPanels` UI component for horizontal, touch-only panel swiping.
- Use it for every current tab-panel surface:
  - Add Round player tabs.
  - Create Game setup tabs.
  - Phase management tabs.
- Remove the Add Round previous/next chevron controls.
- Keep direct tab taps working normally. Tapping a tab still selects that tab through Headless UI, without requiring a drag-style interaction.

No data model, IndexedDB, routing, game-rule, or persistence behavior changes are required.

## Requirements

- One-finger horizontal touch drags on tab panel content visually translate the panel track as the finger moves.
- A panel change commits only when the horizontal movement reaches at least 50px.
- Velocity alone does not advance a panel.
- Swipes stop at the first and last panels and do not wrap.
- Edge swipes use resistance so the user gets feedback without leaving the valid panel range.
- Vertical scrolling remains native and does not change panels.
- Mostly vertical or small accidental movements are ignored.
- Multi-touch gestures cancel the swipe.
- `touchcancel` resets the swipe state.
- Controls that opt out with `data-swipe-navigation-ignore` remain isolated from tab swipes.
- The tab strip itself remains independently scrollable/clickable and does not trigger panel swipes.
- After a committed swipe, the controlled selected index updates so the existing `TabList` selected indicator animates through its current path.

## Design

### Shared component

Create `src/components/ui/SwipeableTabPanels/SwipeableTabPanels.tsx` and export it from `src/components/ui/index.ts`.

The component wraps Headless UI tab panels and exposes a small controlled interface:

```tsx
<SwipeableTabPanels
  selectedIndex={selectedIndex}
  onChange={setSelectedIndex}
  className="..."
>
  <TabPanel>...</TabPanel>
</SwipeableTabPanels>
```

`selectedIndex` is the current tab index from the parent `TabGroup`. `onChange` receives the adjacent index after a committed swipe. The component derives `tabCount` from its children, so callers do not need to pass redundant counts.

Internally, the component renders a horizontal track where each panel occupies one viewport-width slot of the panel container. It keeps panels mounted while sliding so the previous/current/next content can be seen during the gesture. Inactive panels should be made inaccessible to keyboard and screen-reader navigation while they are not selected.

### Gesture behavior

The component attaches touch listeners to the panel container. It records the starting touch identifier and coordinates when exactly one touch starts outside ignored controls.

During movement:

- If another touch appears, cancel the swipe.
- If vertical motion wins before horizontal intent is clear, abandon the swipe and let native scrolling proceed.
- Once horizontal motion is dominant, prevent native scrolling for that gesture, update the track offset in pixels, and apply edge resistance at the first/last panel.

On touch end:

- If horizontal movement is below 50px, animate back to the current panel.
- If horizontal movement is at least 50px and an adjacent panel exists, animate to that panel and call `onChange` with the next index.
- If the user swipes beyond an edge, animate back to the current panel.

The component does not use velocity as a commit condition. This keeps accidental flicks from advancing panels when the user did not drag far enough.

### Direct tab selection

Direct tab taps continue to use Headless UI's normal tab selection. When `selectedIndex` changes from outside `SwipeableTabPanels`, the component should reset any in-progress drag state and show the selected panel without requiring a swipe. The tab-list active indicator remains owned by the existing `TabList` component.

### Add Round integration

Replace the current local Add Round swipe handlers with `SwipeableTabPanels`.

Remove the overlaid previous/next chevrons from the Add Round body. The tab strip and swipeable panels become the only player-navigation mechanisms. Keep `data-swipe-navigation-ignore` on the score wheel so wheel dragging does not navigate between players.

### Other tab integrations

`CreateGame` already controls `selectedIndex`, so it can swap `TabPanels` for `SwipeableTabPanels` directly.

`Phases` currently uses uncontrolled tabs. Convert it to a controlled `TabGroup` with local `selectedIndex` so it can use the same shared component.

## Edge Cases

- One panel: swipes do nothing.
- First panel + right swipe: resistant drag, then snap back.
- Last panel + left swipe: resistant drag, then snap back.
- Mostly vertical drags: scroll normally and do not translate the track.
- Multi-touch: cancel and return to the selected panel.
- Drag starts inside a swipe-ignored control: the control handles the interaction normally.
- Tab tap during or after a drag: selected panel reflects the tab selection and stale drag state is cleared.

## Verification

- Run `npm run lint`.
- Run `npm run build`.
- Perform touch-capable UI verification:
  - Add Round card follows the finger during horizontal swipe and commits only after 50px.
  - Add Round no longer shows previous/next chevrons.
  - Add Round score wheel remains isolated from panel swiping.
  - Create Game setup panels swipe with the same mechanics.
  - Phase management panels swipe with the same mechanics.
  - Vertical scrolling inside panel content still works.
  - Swiping at the first/last panel gives resistance and snaps back without wrapping.
  - Tapping tab-list tabs still selects tabs normally.
