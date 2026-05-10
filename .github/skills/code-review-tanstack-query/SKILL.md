---
name: code-review-tanstack-query
description: Use when reviewing TanStack Query hooks, query keys, queryOptions, mutations, invalidation, cache behavior, or local-first data fetching
---

# TanStack Query Code Review Expert

Review only TanStack Query concerns. This app uses Query as a local cache over IndexedDB, not as a network cache.

## Review Focus

- Use query key factory objects with hierarchical keys.
- Centralize query config with `queryOptions()` for type safety and reuse.
- Mutations invalidate related queries using the broadest relevant key, without excessive invalidation.
- Preserve local-first defaults from project conventions: `staleTime: Infinity`, `retry: false` unless there is an explicit reason.
- Check cache correctness, query key identity, mutation success paths, invalidation breadth, and hook/API boundary consistency.

## Example Pattern

```typescript
export const playerKeys = {
  all: ["players"] as const,
  lists: () => [...playerKeys.all, "list"] as const,
  list: (filters: { ... }) => [...playerKeys.lists(), filters] as const,
};

export function playerListOptions(filters?: { ... }) {
  return queryOptions({
    queryKey: playerKeys.list(filters ?? {}),
    queryFn: () => playersApi.getAll(filters),
  });
}
```

## Output

Return `No findings in scope.` or findings with severity, file/line, evidence, cache behavior risk, and a concrete fix.
