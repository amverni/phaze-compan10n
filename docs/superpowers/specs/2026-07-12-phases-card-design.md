# Phases Card Design

## Goal

Add a **Phases Card** feature that lets players view, share, and import the ordered phases for a Phase Set outside and inside a game.

## Scope

In scope:

- Add a `/phasescard` route that defaults to the app's default Phase Set and lets the user choose another visible Phase Set.
- Add `/phasescard/$id` for specific existing Phase Set IDs.
- Add `/phasescard/custom?data=...` for self-contained custom Phase Set links.
- Add a Home header button in the top-left position that navigates to `/phasescard`.
- Add a Game header button in the top-left position that opens a Phases Card dialog for that game's exact phase list.
- Add clipboard sharing with a 5-second checkmark success state.
- Add import/save behavior for self-contained custom links.

Out of scope:

- Server-backed short links.
- Editing phases from the Phases Card UI.
- Changing game scoring, phase completion, or tiebreaker rules.
- Replacing the existing phase management screens.

## Domain language

The design uses the glossary terms from `CONTEXT.md`:

- **Phase**: a required card objective.
- **Phase Set**: the ordered list of phases used by a game.
- **Phases Card**: a shareable reference card for a Phase Set that lists its phases in order.

**Phase Card** is an accepted alias for **Phases Card**. The route name uses `phasescard` for consistency with the requested URL shape.

## Approved direction

Create a shared `src/components/PhasesCard/` feature module used by both the route and the game dialog. The shared module owns the phase list rows, share button, custom URL encoding/decoding helpers, and imported-card save behavior. Route files stay thin and choose only which Phases Card source to render.

The Phases Card page uses the existing `CardBackground` layout, logo header, shared `List` component, and glass UI conventions. The game dialog reuses the same list and share button so the route and dialog cannot drift.

## Routes and navigation

`/phasescard` renders the selectable Phases Card page. It loads app settings, selects `settings.gameDefaults.phaseSetId` by default, and displays a dropdown of visible Phase Sets at the top of the main content.

`/phasescard/$id` renders a specific existing Phase Set. The dropdown is hidden and replaced by the Phase Set name in the same top content area. This route is primarily for built-in Phase Set share links. If the ID is not found locally, the page shows an explicit invalid or missing Phase Set state.

`/phasescard/custom?data=...` renders a self-contained custom Phases Card. The decoded payload supplies the Phase Set name and ordered phase requirements. The top content area displays the Phase Set name. A Save button appears only when the user does not already have a matching saved Phase Set.

The Home page adds a top-left circular glass button opposite the existing menu button. It uses a phase/list-style icon and links to `/phasescard`.

The Game page adds a top-left circular glass button in the header. It opens a Phases Card dialog for the game's exact `game.phaseSet` snapshot.

Because the app uses TanStack Router hash history for GitHub Pages, copied share URLs must be absolute hash URLs such as `https://amverni.github.io/phase-10-scoreboard/#/phasescard/original` and `https://amverni.github.io/phase-10-scoreboard/#/phasescard/custom?data=...`. Shared links must not point to bare browser-history paths that would 404 on GitHub Pages.

## Phases list

The list uses the shared `List` component. Each row contains:

- a 1-based phase number,
- the phase display name from `formatPhaseDisplayName`.

The list preserves the Phase Set order. For existing Phase Sets, phases are resolved in the order stored on `phaseSet.phases`. For custom URL payloads and game snapshots, the payload/source order is authoritative.

## Sharing

The share button uses the Lucide `Share` icon and black accents. Visually it should read as a small Phase 10-style card, similar in spirit to the Add Round score-entry card treatment, not as a plain circular icon button.

When pressed, the button builds the best available URL and writes it to the clipboard:

- built-in Phase Sets use `/phasescard/$id`,
- game Phase Sets use `/phasescard/$id` only when their ordered phases exactly match a built-in Phase Set,
- saved/custom/game-specific Phase Sets otherwise use `/phasescard/custom?data=...`.

Clipboard success swaps the icon to a checkmark for 5 seconds. Clipboard failure shows an explicit failure message using the app's existing inline/toast patterns.

Save success on an imported custom card hides the Save button and shows a short success indication consistent with the share success treatment.

## Custom URL payload

Custom share links encode a compact JSON payload as URL-safe base64url UTF-8 data. Version 1 payloads have this shape:

```ts
interface PhasesCardSharePayloadV1 {
  v: 1;
  name: string;
  phases: Array<{
    requirements: Array<
      | { type: "set" | "run"; count: number; quantity: number; isSameColor: boolean }
      | { type: "colorGroup"; count: number; quantity: number; isSameColor: true }
    >;
  }>;
}
```

The payload does not contain local phase IDs or saved Phase Set IDs because recipients may not have the same IndexedDB data. Decoding validates the schema and phase requirements before rendering. Invalid data produces an explicit invalid-link state instead of falling back to defaults.

Validation rules for version 1:

- `v` must be exactly `1`; unknown versions are invalid.
- `name` must be a non-empty string after trimming.
- `phases` must contain at least one phase and no more than 50 phases.
- each phase must contain at least one requirement and no more than 10 requirements.
- requirement `type` must be one of the current `Meld` union values.
- `count` and `quantity` must be finite positive integers.
- `isSameColor` must be boolean for `set` and `run`, and `true` for `colorGroup`.
- decoded JSON over 8 KB is invalid.

The versioned payload allows future formats to be added deliberately without guessing how to interpret old links.

## Equality and matching rules

Phase equality for Phases Card sharing and imported-card duplicate detection ignores local IDs and compares normalized requirements structurally. Requirement order is significant because it affects the display name. Each requirement compares `type`, `count`, `quantity`, and `isSameColor`.

Phase Set equality compares the ordered list of phases using the phase equality rule. For imported-card Save visibility, the Phase Set name must also match exactly after trimming. For game-share URL selection, only built-in Phase Sets are considered for short `/phasescard/$id` URLs; saved/custom/game-specific sets use self-contained custom URLs unless they exactly match a built-in Phase Set by ordered phase requirements.

## Saving imported custom cards

Imported custom links can be saved into the local reusable library. Saving creates or reuses Saved Phases for matching requirements, then creates a Saved Phase Set using those local phase IDs.

The Save button is hidden when a local Saved Phase Set has the same name and the same ordered phase requirements as the imported card, ignoring local generated IDs. After a successful save, relevant Phase Set, Phase, and Settings/selection queries are invalidated so the new set appears in existing screens.

## Game dialog

The in-game Phases Card button opens a Headless UI-backed app `Dialog`. The dialog contents are:

- a top toolbar with the share card button aligned top-right,
- the phases list below the toolbar.

The share control must not overlap the list. The dialog does not include the Phase Set dropdown; it always displays the game's exact current phase list.

## Error handling and empty states

Missing or invalid existing Phase Set IDs show an explicit error state. Invalid custom URL payloads show an invalid-link message. Save failures and clipboard failures are surfaced rather than silently ignored.

Empty lists use the existing `List` empty state, though valid Phase Sets should contain at least one phase.

Loading states use the existing `List` shimmer rows for phase lists and a compact loading label where the top selector/title would appear.

## Implementation boundaries

Expected units:

- `PhasesCardPage`: full-page `CardBackground` route UI.
- `PhasesCardDialog`: game dialog wrapper.
- `PhasesCardList`: shared numbered list.
- `PhasesCardShareButton`: shared clipboard/share state.
- `phasesCardUrl` helpers: build and parse built-in/custom share URLs.
- `phasesCardImport` API/helper functions: save imported custom Phase Sets through the data API layer.

Components do not access IndexedDB directly. Persisted reads and writes go through existing or new functions in `src/data/api/`, with TanStack Query hooks/options in `src/data/hooks/` where UI needs cached data.

## Accessibility

The Home and Game header buttons have descriptive accessible labels. The share button has an accessible label that changes or announces success without relying only on icon shape. The Phase Set dropdown uses the existing Headless UI `Listbox` wrapper. The dialog keeps the existing focus trap and swipe-to-dismiss behavior.

## Validation

- Run `npm run lint`.
- Run `npm run build`.
- Verify `/phasescard` loads the default Phase Set and can switch Phase Sets.
- Verify `/phasescard/$id` hides the dropdown and shows the Phase Set name.
- Verify `/phasescard/custom?data=...` renders without local IDs and offers Save only when appropriate.
- Verify Home navigation, Game dialog opening, clipboard success state, and invalid custom-link behavior.
