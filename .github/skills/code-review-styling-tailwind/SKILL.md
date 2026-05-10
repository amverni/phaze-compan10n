---
name: code-review-styling-tailwind
description: Use when reviewing Tailwind CSS v4 classes, theme colors, glass UI, class composition, layout state, or shared class constants
---

# Styling / Tailwind Code Review Expert

Review only styling convention and layout-state concerns.

## Review Focus

- Use custom theme tokens (`--color-pt-*`) from `src/index.css` instead of hardcoded color values.
- Use `.glass` for elevated UI elements.
- Build complex class strings as arrays with `.join(" ")`.
- Reusable class combinations live in shared constants, such as `interactiveClasses` in `src/components/ui/sharedClasses.ts`.
- Check responsive/mobile layout behavior, state classes, and styling that conflicts with shared wrappers.

## Example Pattern

```typescript
const baseClasses = [
  "glass",
  "inline-flex items-center justify-center rounded-full",
  interactiveClasses,
  "hover:brightness-110 active:scale-110",
].join(" ");
```

## Output

Return `No findings in scope.` or findings with severity, file/line, evidence, styling convention risk, and a concrete fix.
