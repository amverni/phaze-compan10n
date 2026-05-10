---
name: code-review-tanstack-form
description: Use when reviewing submitted forms, validation, field state, form submission behavior, or TanStack Form integration
---

# TanStack Form Code Review Expert

Review only submitted form behavior and validation concerns.

## Review Focus

- Use TanStack Form for submitted forms; do not manage submitted field state with raw `useState`.
- Search/filter UI state is fine with local state when it is not part of form submission.
- Cheap validation (required, format) belongs inline on fields.
- Async domain validation, such as uniqueness checks, belongs in API calls on submit.
- Integrate with Headless UI form primitives (`<Fieldset>`, `<Label>`, `<Legend>`) for accessibility.
- Check submit disabled states, error display, reset/cancel behavior, and async submit consistency.

## Output

Return `No findings in scope.` or findings with severity, file/line, evidence, form behavior risk, and a concrete fix.
