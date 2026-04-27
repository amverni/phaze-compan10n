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

- **Always use app wrappers over native HTML or raw Headless UI** — shared wrappers in `src/components/ui/` (Button, Dialog, Input, SearchBar, Listbox, Switch, TabList, etc.) provide consistent glass styling, interactive states, and accessibility. Never reach for native elements (`<button>`, `<input>`, `<dialog>`) or import directly from `@headlessui/react` when a wrapper exists. Pass only additional classes (e.g., sizing) via `className`; the wrapper handles base styling via `mergeClassName()`.
- Follow the existing `mergeClassName()` pattern in `src/components/ui/mergeClassName.ts` for className handling when creating new wrappers

---

## Icons

- **Always use the project's icon library** — never create icons from text characters (e.g., `+`, `×`, `▶`), inline SVGs, or other ad-hoc approaches. The icon library provides consistent sizing, stroke width, and accessibility. When reviewing code, flag any character-based or hand-rolled SVG icon and recommend the appropriate library equivalent.

---

## Component Reuse

- **Extract repeated UI patterns into `src/components/ui/`** — when the same combination of elements, styling, and behavior appears in 2+ places, it should be a shared component. Look for identical or near-identical JSX structures (e.g., a glass pill with an icon + input + clear button → `SearchBar`). Wrappers should mirror the Headless UI prop interface where applicable to feel native.
- When reviewing code, flag duplicated UI structures across components as candidates for extraction into `src/components/ui/`.

---

## IndexedDB / idb

- **Version migrations**: check for store/index existence before creating in `upgrade()`, increment DB version for schema changes
- Use transactions for batch operations (see `deleteByGameId` in `src/data/api/rounds.ts`)

---

## Data Architecture & Separation of Concerns

- **Components should not contain data logic** — filtering, sorting, aggregation, random sampling, and any logic that decides *which* data to return belongs in the API layer (`src/data/api/`), not in components or event handlers. Components call API methods and render results; they don't orchestrate queries and transform raw data.
- **Follow the established data flow**: `Routes → Components → TanStack Query hooks → API layer → IndexedDB`. Each layer has a single responsibility. When reviewing code, flag data logic that has leaked into components and recommend moving it to the API layer.
- **Design API methods as stable contracts** — write API function signatures as if they could be backed by a REST endpoint. This keeps the codebase ready for a future backend migration without component changes.
