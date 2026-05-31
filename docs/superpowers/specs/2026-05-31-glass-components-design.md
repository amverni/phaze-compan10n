# Glass Components UX Design

## Outcome

Update the shared glass visual treatment so every `.glass` surface feels more transparent and more heavily frosted. Background color and motion should show through enough to feel dimensional, but details behind the surface should be blurred enough that labels, scores, buttons, dialogs, and panels stay readable.

## Scope

In scope:

- Tune the global `.glass` CSS custom properties in `src/index.css`.
- Tune the `.glass::after` shine overlay so it does not cancel out the increased transparency.
- Apply the change globally to all existing `.glass` consumers.
- Preserve current component structure and markup.

Out of scope:

- Adding per-component glass variants.
- Changing routing, data flow, IndexedDB behavior, or game-domain logic.
- Reworking Tailwind class composition outside directly affected visual checks.

## Design direction

Use the **heavy frosted glass** direction:

- Lower the visible fill opacity from the current glass treatment.
- Increase the backdrop blur substantially.
- Keep saturation and brightness tuned per color scheme so light mode remains crisp and dark mode remains legible.
- Preserve enough border and shadow contrast to maintain component boundaries.
- Reduce the shine overlay opacity/background alongside the main fill so surfaces become genuinely more transparent instead of just blurrier.

## Implementation approach

Use a single global CSS-variable update. The `.glass` class already centralizes the surface contract in `src/index.css`, and existing components pair variant or state classes with `.glass`. Updating that contract is the smallest coherent change and keeps all glass surfaces visually consistent.

Do not introduce named density variants yet. If a future screen needs a denser or clearer surface, add variants only after the global pass reveals a concrete need.

## Representative surfaces to inspect

Validate the global treatment against glass-heavy examples rather than every call site one by one:

- Card/panel surfaces that create the main app shell.
- Scoreboard rows and sticky areas where text density is high.
- Small glass controls such as icon buttons.
- Headless UI surfaces such as popovers, listboxes, and dialogs.

## Risks and safeguards

- **Legibility risk:** Lower opacity can let high-contrast background shapes compete with text. Use the heavier blur, borders, and shadows to preserve readability.
- **Light-mode washout risk:** Transparent white surfaces can disappear on white backgrounds. Keep light-mode border/shadow contrast.
- **Dark-mode muddiness risk:** Heavy blur plus dark brightness tuning can flatten surfaces. Keep enough saturation/brightness and edge definition.
- **Component drift risk:** A global update affects all `.glass` consumers. Validate representative screens before considering per-component exceptions.

## Validation

Run existing quality checks:

- `npm run lint`
- `npm run build`

Use browser screenshots for representative glass-heavy screens in light and dark where practical, focused on:

- text contrast,
- background bleed through glass,
- component boundaries,
- existing shape, shadow, and sticky-surface behavior.

No data-flow or error-handling changes are expected.
