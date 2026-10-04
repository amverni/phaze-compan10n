---
name: code-review-typescript
description: Use when reviewing TypeScript types, props, API or hook signatures, generics, casts, nullability, discriminated unions, or domain identifiers
---

# TypeScript Code Review Expert

Review only TypeScript soundness and type-boundary concerns. Report concrete type holes, unsafe casts, narrowing bugs, or public contract problems.

## Review Focus

- Preserve discriminated unions for state variants, e.g. `Game = ActiveGame | CompletedGame` via `status`.
- Prefer precise domain types (`GameId`, `PlayerId`, `PhaseSetId`) over anonymous `string` in public app/API boundaries.
- Avoid `as any`, broad `unknown as ...`, and casts that hide invalid data flow. Generated files such as `src/routeTree.gen.ts` are exempt.
- Keep API and hook signatures as stable contracts; callers should not need IndexedDB storage details.
- Export reusable public types through `src/types/index.ts`.
- Check exhaustive handling, nullability, generic inference, branded/domain IDs, tuple helpers like `ArrayAtLeastOne`, and prop/API return types.

## Output

Return `No findings in scope.` or findings with severity, file/line, evidence, unsound scenario, and a concrete fix. Do not comment on formatting or style preferences.
