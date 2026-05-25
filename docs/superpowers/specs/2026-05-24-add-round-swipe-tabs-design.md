# Add Round Swipe Tabs Design

## Goal

Enable touch swipe navigation between player tabs in the add-round dialog. A left or right swipe on the add-round tab content should select the adjacent player tab in that direction.

## Requirements

- Swipe recognition is touch-only.
- Swipe recognition is limited to the tab panel/content area, not the tab strip or the full dialog.
- Swipes stop at the first and last player tabs; they do not wrap.
- Vertical scrolling and normal form controls inside the panel continue to work.
- Existing tab buttons, prev/next chevrons, tab indicator, and selected-tab scrolling keep their current behavior.

## Design

`AddRoundDialog` already uses a controlled Headless UI `TabGroup` with `selectedIndex` and `setSelectedIndex`. Add a small local touch-swipe handler in this component and attach it directly to the existing `TabPanels` scroll area. The handler records the first touch position, compares it with the touch end position, and treats a mostly-horizontal movement of at least 50px as navigation.

The handler will call `setSelectedIndex` with a clamped next index:

- Swipe left advances to `selectedIndex + 1`.
- Swipe right goes to `selectedIndex - 1`.
- Index values are clamped to `0` and `players.length - 1`.

To preserve scrolling, the gesture only fires when horizontal movement is strongly dominant over vertical movement and crosses the minimum threshold. Use a 2:1 horizontal dominance ratio rather than a loose `abs(x) > abs(y)` check so diagonal gestures do not race the dialog's existing swipe-to-dismiss behavior. The handler does not prevent default touch behavior during movement, so vertical panel scrolling remains native.

The implementation stays local to `AddRoundDialog`. A shared hook or UI primitive is intentionally deferred until another screen needs the same gesture behavior.

## Gesture Isolation

- Track the initial touch identifier with the start coordinates and ignore end events for other touches.
- Reset when a gesture starts with anything other than one touch, or when another finger is introduced before the gesture ends.
- Reset on `touchcancel`.
- Ignore gestures that start inside the wheel selector so vertical score entry cannot advance tabs.
- Do not call `preventDefault`; the gesture is navigation-only and should not lock native scroll.

## Integration Points

- `src/components/Scoreboard/AddRoundDialog.tsx`
  - Store the touch start coordinates in a ref.
  - Add `onTouchStart`, `onTouchMove`, `onTouchEnd`, and `onTouchCancel` handlers to the existing `TabPanels` element after confirming Headless UI forwards those DOM props. `onTouchMove` only detects multi-touch cancellation; the tab-change decision happens at `touchend`.
  - If `TabPanels` does not forward touch props, wrap it in a thin div with the same handlers rather than changing the tab architecture.
  - Reuse the existing selected-index state and selected-tab scroll effect.

- `src/components/ui/WheelSelector/WheelSelector.tsx`
  - Add a data attribute to the wheel root if needed so `AddRoundDialog` can ignore gestures that begin inside score-wheel controls.

No data model, IndexedDB, routing, or shared UI primitive changes are required.

## Edge Cases

- One player or zero adjacent tabs: swipes leave the selected index unchanged.
- At first tab: right swipes leave the selected index unchanged.
- At last tab: left swipes leave the selected index unchanged.
- Mostly vertical gestures are ignored.
- Small accidental movements below the threshold are ignored.
- Canceled touches reset the stored touch start without changing tabs.
- Multi-touch starts are ignored or reset so pinch/zoom-style gestures do not accidentally change tabs.
- Dragging the wheel selector updates the wheel only and does not change tabs.

## Verification

- Run `npm run lint`.
- Run `npm run build`.
- Perform UI verification for the add-round dialog on a touch-capable viewport:
  - Horizontal swipes across the panel body switch player tabs.
  - Vertical swipes inside the panel scroll content and do not switch tabs.
  - Slow diagonal swipes at the top of the panel do not trigger both tab navigation and dialog dismissal.
  - Dragging the wheel selector changes the score and does not switch tabs.
  - Two-finger gestures do not switch tabs.
  - Swiping right at the first tab and left at the last tab is a no-op.
  - Swiping the tab strip itself scrolls the tab strip and does not trigger panel swipe navigation.
