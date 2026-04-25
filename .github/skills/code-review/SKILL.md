---
name: code-review
description: >
  Code review and best practices guide for the Phase 10 scoreboard app.
  Use this skill when reviewing pull requests, evaluating code quality, or writing new code.
  Covers React 19, TypeScript, TanStack (Query, Router, Form), Tailwind CSS v4,
  Headless UI, and IndexedDB/idb.
---

# Code Review & Best Practices

Use this guide when reviewing PRs, evaluating code changes, or writing new code. For architecture overview and build commands, see `.github/copilot-instructions.md`.

---

## TanStack Query Patterns

**Query key factories** — always use a key factory object with hierarchical keys:

```typescript
export const playerKeys = {
  all: ["players"] as const,
  lists: () => [...playerKeys.all, "list"] as const,
  list: (filters: { ... }) => [...playerKeys.lists(), filters] as const,
  details: () => [...playerKeys.all, "detail"] as const,
  detail: (id: PlayerId) => [...playerKeys.details(), id] as const,
};
```

**`queryOptions()`** — centralize query config for type safety and reuse:

```typescript
export function playerListOptions(filters?: { ... }) {
  return queryOptions({
    queryKey: playerKeys.list(filters ?? {}),
    queryFn: () => playersApi.getAll(filters),
  });
}
```

**Mutations** — invalidate related queries using the broadest relevant key:

```typescript
export function useCreatePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => playersApi.create(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: playerKeys.all }),
  });
}
```

---

## TanStack Form

- **Validation split**: cheap validation (required, format) inline on fields; async domain validation (e.g., uniqueness checks) via API calls on submit
- Integrate with Headless UI form primitives (`<Fieldset>`, `<Label>`, `<Legend>`) for accessibility

---

## Tailwind CSS v4

**Class composition** — build complex class strings as arrays:

```typescript
const baseClasses = [
  "glass",
  "inline-flex items-center justify-center rounded-full",
  interactiveClasses,
  "hover:brightness-110 active:scale-110",
].join(" ");
```

Reusable class combinations live in shared constants (e.g., `interactiveClasses` in `src/components/ui/sharedClasses.ts`).

---

## Headless UI

- Shared wrappers in `src/components/ui/` with consistent glass styling
- Follow the existing `mergeClassName()` pattern in `src/components/ui/mergeClassName.ts` for className handling in wrappers
- Native `<input>` elements are used directly — no wrapping needed

---

## IndexedDB / idb

- **Version migrations**: check for store/index existence before creating in `upgrade()`, increment DB version for schema changes
- Use transactions for batch operations (see `deleteByGameId` in `src/data/api/rounds.ts`)
