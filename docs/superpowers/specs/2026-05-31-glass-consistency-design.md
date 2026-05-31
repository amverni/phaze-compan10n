# Glass Consistency Design

## Outcome

Make the app's glass surfaces feel consistent, less milky, and more blur-driven. Background color should show through enough to preserve the glass effect, but blur and edge definition should keep labels, controls, and dense game data readable.

## User-approved direction

Use a simple role-based glass system instead of screen-specific visual compensation. The goal is not to make every surface mathematically identical against every backdrop; the goal is for Settings listboxes, Add Round listboxes, dialogs, popovers, and base panels to share one coherent material language that is easy to maintain.

The accepted cost is that perceived opacity may still vary slightly because backdrops differ. That is preferable to adding per-screen overrides that would make future drift more likely.

## Scope

In scope:

- Reframe the glass system around a small set of shared surface roles.
- Tune existing CSS-variable overrides for those roles.
- Keep the current component structure, Headless UI wrappers, routing, and data flow.
- Validate representative surfaces in light and dark mode.

Out of scope:

- Per-screen glass overrides for Settings, Add Round, or other individual features.
- New component APIs for glass density.
- Data, IndexedDB, game-rule, routing, or form behavior changes.
- Abstract visual companion mockups as approval evidence.

## Surface roles

### Base glass

Owned by `.glass` in `src/index.css`.

Used for app-shell panels, list containers, score surfaces, tab indicators, buttons, and other non-floating surfaces. This role should be the baseline material: transparent enough to show color bleed, blurred enough to reduce detail, and defined by a consistent border and shadow.

### Floating glass

Owned by `.listbox-glass` and `.popover-glass`.

Used for scrim-less Headless UI floating panels. These surfaces can appear over arbitrary dark, bright, or colorful content, so they should be slightly safer than base glass. They should still share the less-milky, blur-first direction, but may keep more fill or stronger brightness tuning than dialogs to preserve text contrast without a backdrop scrim.

Listbox and popover should remain aligned because they have the same UX role: transient floating option panels without a modal scrim.

### Dialog glass

Owned by `.dialog-glass`.

Used for modal surfaces with a surrounding overlay/scrim. Dialogs can be more transparent than scrim-less floating panels because the backdrop already reduces visual noise. Dialog fill should not be used as the readability crutch; blur, scrim, border, and shadow should do more of the work.

### Nested glass inside dialogs

Dialog content may contain other `.glass` surfaces such as lists and buttons. These should inherit the same role model and receive only structural edge tuning when needed. Avoid nested overrides that make inner controls look like a different material.

## Design principles

- **Prefer shared roles over local exceptions.** If Settings and Add Round feel different, first tune the shared floating role rather than adding screen-specific classes.
- **Blur before milkiness.** Increase backdrop blur and reduce excessive white fill where readability allows.
- **Preserve edge definition.** Transparent glass still needs borders, shadow, and subtle shine so controls do not disappear on white backgrounds.
- **Treat scrim-less surfaces more carefully.** Listboxes and popovers need stronger contrast safeguards than dialogs.
- **Avoid double backdrop-filter passes.** Keep blur on the surface itself; do not add backdrop-filter to pseudo-elements.
- **Use visual QA from the real app.** The approval signal should come from actual Settings, Add Round, dialog, listbox, and popover states rather than simplified mockups.

## Implementation model

The CSS custom-property contract remains the boundary:

- `src/index.css` defines the base `.glass` variables.
- `src/components/ui/Listbox/Listbox.css` defines the floating listbox role.
- `src/components/ui/Popover/Popover.css` defines the floating popover role and should stay visually aligned with Listbox.
- `src/components/ui/Dialog/Dialog.css` defines the dialog role.

No component should read or write IndexedDB, hook state, or app data differently for this change. Route files and feature components should not need markup changes unless validation finds a component is bypassing the shared glass contract.

## Alternatives considered

### Recommended: simple role-based glass

Use base, floating, and dialog roles with a shared blur-first direction. This gives the best balance of consistency, readability, and maintainability.

Trade-off: perceived opacity can vary slightly by backdrop, especially between Settings and Add Round.

### Exact token equality

Force every glass surface to use the same fill, blur, border, and shadow values.

Trade-off: simpler mechanically, but dialogs with a scrim and listboxes without a scrim have different readability needs. This is likely to make one context feel wrong.

### Per-screen perceived matching

Tune Settings, Add Round, and future screens independently until they look closer by eye.

Trade-off: can produce the strongest local match, but it creates the inconsistency problem again and makes future changes harder to reason about.

## Validation plan

Use real app states, not the visual companion, to judge the result:

- Settings listboxes for default tiebreaker, phase set, and skip penalty.
- Add Round dialog body and Round Winner listbox.
- Popovers such as Add Round progress.
- Base panels and controls on home, player list, game setup, and scoreboard screens.
- Light and dark mode.
- Dark, bright, and colorful backdrops where floating panels can appear.

Quality gates:

- `npm run lint`
- `npm run build`
- Playwright screenshots when the target state is scriptable; manual browser inspection is acceptable for states that depend on existing IndexedDB data.
- Contrast checks for floating panel text over bright and dark backdrops when tuning their fill/brightness.

Pass/fail criteria:

- Real-app screenshots show visible background color bleed through glass surfaces without obvious unblurred detail behind text.
- Settings and Add Round floating panels use the same floating role and no screen-specific glass class.
- Dialogs can appear lighter/more transparent than floating panels, but should not read as a fully white card.
- Floating panel text remains readable over dark, bright, and colorful backdrops. When a sampled color contrast can be measured, normal text should meet at least 4.5:1.
- No new per-screen override is accepted unless the validation notes identify the failing surface and explain why the shared role cannot fix it without harming other role consumers.

## Risks

- **Too transparent:** text competes with the backdrop, especially in scrim-less listboxes.
- **Too frosted:** surfaces become gray or white boxes again, defeating the user's stated goal.
- **Too many exceptions:** per-screen overrides may fix one complaint while reintroducing broader inconsistency.
- **Backdrop-filter cost:** larger blur radii can be more expensive, so validation should include interactive floating panels and dialog transitions.

## Decision

Proceed with the simple role-based design. Tune fewer shared roles, prioritize stronger blur over heavier fill, and only add local exceptions if real-app validation proves a contrast or readability issue that cannot be solved at the role level.
