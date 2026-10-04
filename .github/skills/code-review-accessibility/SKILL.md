---
name: code-review-accessibility
description: Use when reviewing forms, dialogs, popovers, listboxes, keyboard access, focus behavior, ARIA, labels, disabled states, or motion
---

# Accessibility Code Review Expert

Review only accessibility concerns. Treat access blockers as concrete bugs; avoid subjective UX preference comments unless behavior prevents access or recovery.

## Review Focus

- Keyboard access for all interactive controls and flows.
- Focus trap/restore for dialogs and popovers, visible focus, and predictable tab order.
- Accessible names, semantic roles, ARIA correctness, form labels, field errors, and disabled affordances.
- Motion and transition changes that may need reduced-motion handling.
- Prefer existing `src/components/ui/` wrappers because they carry shared accessibility behavior; flag raw elements or raw Headless UI when wrappers exist.

## Output

Return `No findings in scope.` or findings with severity, file/line, evidence, affected user scenario, and a concrete fix.
