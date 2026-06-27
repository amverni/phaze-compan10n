# Tiebreaker Buttons Design

## Goal

Improve tiebreaker score-entry controls so the quick buttons read as tactile Phase 10-style cards, fit in a single horizontal row, and keep Points Tiebreaker counters visually separate from the buttons.

## Scope

In scope:

- Restyle tiebreaker quick buttons in `TiebreakerEntrySection`.
- Apply the card-shaped treatment to both Points Tiebreakers and Count Tiebreakers.
- Keep the current Points quick actions: `+5`, `+10`, `Skip`, and `Wild`.
- Move Points quick-button counters below the corresponding card.
- Keep quick buttons and the wheel selector in the same horizontal control row.

Out of scope:

- Changing tiebreaker rules, scoring values, or persisted data.
- Changing the wheel selector behavior.
- Adding a shared generic card-button primitive before another screen needs it.
- Changing Round Result buttons.

## Domain language

The design uses the glossary terms from `CONTEXT.md`:

- **Points Tiebreaker**: compares a point total.
- **Count Tiebreaker**: compares a counted gameplay event such as wild cards or skip cards.
- **Skip Card**: the card represented by the compact `Skip` label in the Points quick-button row.

## Approved direction

Use the throwaway prototype's **Mini Phase 10 card** treatment as the basis for the real buttons.

Each quick button is a vertical rounded rectangle with inset top and bottom slanted fills. The slants angle upward from left to right, echoing the app's Phase 10 card-panel motif. The fill should be subtle enough to preserve the glass UI language, but visible enough that the buttons do not look like plain rounded rectangles.

The approved refinement is a compact-fit version of that treatment: cards should be thinner, less rounded, and less bordered so the Points row normally fits without horizontal scrolling while still reading as mini Phase 10 cards.

## Layout

Points Tiebreaker controls keep the current high-level structure:

- label above the controls,
- quick-button group on the left,
- wheel selector on the right.

The quick-button group becomes a no-wrap horizontal row. It may scroll horizontally if the available width is unusually small, but the normal Add Round layout should show all four Points buttons without wrapping. The wheel selector remains visible and does not scroll with the quick-button group.

The quick-button row and the wheel selector should read as one fluid control row. Align the wheel selector to the visual center of the card buttons, not the full card-plus-counter stack, so the wheel does not feel vertically detached from the cards.

Count Tiebreakers use the same row model: count quick-set cards on the left and the wheel selector on the right. The `1`-`5` cards stay in one row and may horizontally overflow if needed.

## Button styling

All tiebreaker quick buttons use the same base shape:

- glass surface,
- slim vertical rounded rectangle,
- inset slanted cap near the top,
- inset slanted cap near the bottom,
- centered label text,
- press/hover/disabled states consistent with the current buttons.

Compared with the first Mini Phase 10 card implementation, the refinement should reduce card width, card padding, card border radius, row gap, and cap border prominence. Target a `0.5rem` outer card radius. Keep the slanted fills present but lighter so the row feels tighter and less boxy.

Points Tiebreaker cards use per-button accent colors:

| Button | Accent |
| --- | --- |
| `+5` | `pt-blue-500` |
| `+10` | `pt-green-500` |
| `Skip` | `pt-yellow-500` |
| `Wild` | `pt-red-500` |

Count Tiebreaker cards stay visually neutral by default. The selected count card uses the `pt-blue-500` accent/selected treatment so the chosen value is obvious without making every count look like a different action.

## Counters and selected state

Points counters render below each card, outside the button element. They remain visible even when the count is zero. Zero values use muted text; non-zero values use the corresponding card accent and tabular numerals. Each counter should be associated with its button through `aria-describedby` with descriptive text such as `Used 2 times` so assistive tech receives the visible count summary without turning the counter into a separate control.

Count cards do not show separate counters. They set the whole count value, so the selected card should be visually highlighted and retain `aria-pressed`.

## Accessibility

Each quick button remains a native `button` with the existing disabled behavior for players who take a Round Skip or Sit Out. Points buttons keep action-specific accessible labels such as `Add 15 points (Skip)`. Count buttons keep `aria-label="Set to N"` and `aria-pressed` for the selected value.

Counters below Points buttons are visible state summaries; they should not become separate interactive elements.

## Implementation approach

Use a surgical component refresh in `src/components/Scoreboard/TiebreakerEntrySection.tsx`.

Add local helpers or small local components only if they keep the file readable. Do not add a shared `CardButton` primitive yet because this treatment is specific to tiebreaker score entry and has no second consumer.

The slanted caps should be implemented with CSS/pseudo-elements or local class composition that works with the existing `.glass` surface. Because `.glass::after` already defines a shine overlay, the implementation must avoid accidental pseudo-element conflicts or explicitly reset inherited pseudo-element positioning when reusing `::after`.

The horizontal overflow container should include enough padding that focus rings and slanted card caps are not clipped at the scroll edges. Reuse existing interactive/focus class conventions where practical.

## Validation

- Run `npm run lint`.
- Run `npm run build`.
- Verify the Add Round dialog with a Points Tiebreaker:
  - the four quick buttons are in one row,
  - each button looks like a slim vertical mini Phase 10 card,
  - counters appear below the cards,
  - zero counters are muted and non-zero counters are accented,
  - the wheel selector remains beside the button group and aligns visually with the card bodies,
  - the normal Add Round layout does not require horizontal card scrolling.
- Verify the Add Round dialog with Count Tiebreakers:
  - count cards use the same card shape,
  - cards stay in one row,
  - the selected count card is visibly highlighted,
  - no separate counters appear.
- Verify disabled Round Skip and Sit Out states still prevent tiebreaker entry.
