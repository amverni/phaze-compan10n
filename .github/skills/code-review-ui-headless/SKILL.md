---
name: code-review-ui-headless
description: Use when reviewing UI primitives, Headless UI wrappers, controls, dialogs, listboxes, switches, tabs, buttons, or repeated UI structures
---

# UI / Headless Code Review Expert

Review only shared UI primitive, Headless UI integration, and component reuse concerns.

## Review Focus

- Prefer app wrappers over native HTML or raw Headless UI. Shared wrappers in `src/components/ui/` provide glass styling, interactive states, and accessibility.
- Do not reach for native elements (`<button>`, `<input>`, `<dialog>`) or import directly from `@headlessui/react` when a wrapper exists.
- Pass only additional classes via `className`; wrappers handle base styling via `mergeClassName()`.
- Follow `src/components/ui/mergeClassName.ts` when creating wrappers.
- Extract repeated UI patterns into `src/components/ui/` when the same combination of elements, styling, and behavior appears in 2+ places.
- Wrappers should mirror Headless UI prop interfaces where applicable.

## Output

Return `No findings in scope.` or findings with severity, file/line, evidence, UI consistency risk, and a concrete fix.
