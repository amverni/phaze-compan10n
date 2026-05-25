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

To preserve scrolling, the gesture only fires when horizontal movement is greater than vertical movement and crosses the minimum threshold. It does not prevent default touch behavior during movement, so vertical panel scrolling remains native.

## Integration Points

- `src/components/Scoreboard/AddRoundDialog.tsx`
  - Store the touch start coordinates in a ref.
  - Add `onTouchStart`, `onTouchEnd`, and `onTouchCancel` handlers to the existing `TabPanels` element.
  - Reuse the existing selected-index state and selected-tab scroll effect.

No data model, IndexedDB, routing, or shared UI primitive changes are required.

## Edge Cases

- One player or zero adjacent tabs: swipes leave the selected index unchanged.
- At first tab: right swipes leave the selected index unchanged.
- At last tab: left swipes leave the selected index unchanged.
- Mostly vertical gestures are ignored.
- Small accidental movements below the threshold are ignored.
- Canceled touches reset the stored touch start without changing tabs.
- Multi-touch starts are ignored or reset so pinch/zoom-style gestures do not accidentally change tabs.

## Verification

- Run `npm run lint`.
- Run `npm run build`.
- Perform UI verification for the add-round dialog on a touch-capable viewport: horizontal swipes switch player tabs, vertical scrolling still works, and the first/last tabs clamp correctly.
