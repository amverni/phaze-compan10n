---
name: code-review
description: >
  Code review and best practices guide for the Phase 10 scoreboard app.
  Use this skill when reviewing pull requests, evaluating code quality, or writing new code.
  Covers React 19, TypeScript, TanStack (Query, Router, Form), Tailwind CSS v4,
  Headless UI, and IndexedDB/idb.
---

# Code Review & Best Practices

Use this guide when reviewing PRs, evaluating code changes, or writing new code for the Phase 10 scoreboard app.

## Application Context

This is a **client-only single-page app** deployed to **GitHub Pages** as a static site. This shapes many architectural decisions:

- **No server**: No SSR, no API routes, no server components. All code runs in the browser.
- **Static hosting**: The app is built with Vite into static assets and deployed to a subdirectory (`base: "/phase-10-scoreboard/"` in `vite.config.ts`). Asset paths must respect this base path.
- **Hash-based routing**: Uses `createHashHistory()` because GitHub Pages doesn't support server-side URL rewrites for clean URLs. All routes use `/#/path` format.
- **Client-side persistence**: All data lives in IndexedDB via the `idb` library. There is no backend database or API — TanStack Query is used as a local cache/state manager, not for network requests.
- **Offline-capable by nature**: Since there's no server dependency, the app works offline once loaded (data is local).

When evaluating new patterns or libraries, ensure they work in a **purely client-side, static-hosted context**. Avoid patterns that assume a server (SSR, API routes, server actions, server-side redirects, cookie-based auth, etc.).

## Guiding Principles

- **Separation of concerns**: Keep clear boundaries between layers (routes → components → hooks → API → DB). Each layer has a single responsibility. Don't mix data fetching with rendering, or business logic with styling.
- **Simplicity for robustness**: Prefer straightforward solutions over clever ones. Simple code is easier to debug, review, and extend. If a pattern feels complex, question whether the complexity is justified.
- **Modularity and composability**: Build small, focused units — components, hooks, utilities — that do one thing well. New features should compose existing pieces rather than creating monolithic implementations. Favor composition over inheritance; combine simple building blocks to create complex behavior.
- **Reusability for a consistent UI**: Shared UI primitives in `src/components/ui/` are the foundation of a cohesive look and feel. When building new UI, reuse existing components and patterns before creating new ones.
- **Consistency**: Follow existing patterns in the codebase. When adding something new, match the style of surrounding code.
- **Use what we have**: Prefer libraries already in the project over adding new ones or rolling custom solutions. Check `package.json` before introducing a dependency.
- **Official docs are the source of truth**: For any library-specific question, defer to its official documentation and recommended patterns. This skill captures project-specific conventions — not a copy of each library's docs.
- **Don't nitpick formatting**: Biome handles formatting automatically (2-space indent, double quotes, semicolons, line width 100).

## Review Process

When reviewing a PR or code area:

1. **Understand the change**: Read the PR description and identify the intent.
2. **Run the linter**: Execute `npm run lint` (Biome check) and `npm run format` (Biome auto-fix) to catch and resolve formatting and lint issues automatically before reviewing code style.
3. **Check type safety**: Ensure strict TypeScript conventions are followed.
4. **Evaluate data patterns**: Verify TanStack Query/Form usage matches project conventions.
5. **Assess styling**: Check Tailwind usage and consistency with the design system.
6. **Verify accessibility**: Ensure semantic HTML, ARIA attributes, and keyboard support.
7. **Check architecture**: Confirm proper layer separation (API → hooks → components).

---

## TypeScript

### References

- Official docs: https://www.typescriptlang.org/docs/

### Conventions

- **Strict mode** is enabled — `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`
- Use explicit `import type` for type-only imports
- **`interface`** for object shapes, **`type`** for unions, tuples, and aliases
- **Discriminated unions** for state variants (e.g., `Game = ActiveGame | CompletedGame` with a `status` discriminant)
- **Type alias IDs** for domain identifiers (`type PlayerId = string`)
- Prefer existing utility types in `src/types/utils.ts` — check there before creating new ones
- **IndexedDB constraint**: Use `0 | 1` instead of `boolean` for indexed fields (IndexedDB doesn't support boolean indexes)
- Centralize type exports via barrel file at `src/types/index.ts`
- Use `as const` for constant arrays and query keys
- Prefer `unknown` over `any` with type narrowing
- **No type assertions** (`as T`) — use type guards, discriminated unions, or proper typing instead. `as const` is fine.

---

## React 19

### References

- Official docs: https://react.dev/
- React Compiler: https://react.dev/learn/react-compiler

### Conventions

- **Functional components only**, **named exports**, **PascalCase** filenames
- **React Compiler is enabled** — follow the Rules of React (no state/props mutation, no side effects in render, idempotent components). The compiler handles memoization; don't add manual `useMemo`/`useCallback` unless there's a clear, measurable reason.
- For hook usage, context patterns, and React APIs — follow the official React docs. This project doesn't prescribe specific patterns beyond what React recommends.

---

## TanStack Query

### References

- Official docs: https://tanstack.com/query/latest/docs/
- **TkDodo's Practical React Query** (authoritative best practices): https://tkdodo.eu/blog/practical-react-query
  - Key posts:
    - Query Keys: https://tkdodo.eu/blog/effective-react-query-keys
    - Query Options API: https://tkdodo.eu/blog/the-query-options-api
    - React Query as State Manager: https://tkdodo.eu/blog/react-query-as-a-state-manager
    - Mutations: https://tkdodo.eu/blog/mastering-mutations-in-react-query

### Conventions

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

**Local-first defaults** — this app uses IndexedDB, so the QueryClient is configured with `staleTime: Infinity`, `retry: false`, `refetchOnWindowFocus: false`, `refetchOnReconnect: false`. Don't change these without good reason.

---

## TanStack Router

### References

- Official docs: https://tanstack.com/router/latest/docs/

### Conventions

- **File-based routing** via `@tanstack/router-plugin` — route tree is auto-generated at `src/routeTree.gen.ts` (never edit manually)
- **Hash history** (`createHashHistory()`) for GitHub Pages compatibility
- Keep route files thin — delegate to components, don't put business logic in routes
- Register the router type globally for type-safe navigation
- Use router navigation — never `window.location`

---

## TanStack Form

### References

- Official docs: https://tanstack.com/form/latest/docs/

### Conventions

- Use TanStack Form for all forms — don't manage form state with raw `useState`
- Follow the official docs for field rendering, validation, and subscriptions
- **Validation split**: cheap validation (required, format) inline on fields; async domain validation (e.g., uniqueness checks) via API calls on submit
- Integrate with Headless UI form primitives (`<Fieldset>`, `<Label>`, `<Legend>`) for accessibility

---

## Tailwind CSS v4

### References

- Official docs: https://tailwindcss.com/docs

### Conventions

- Uses **Vite plugin** (`@tailwindcss/vite`)
- Custom theme in `src/index.css` using `@theme` block — use theme tokens (`--color-pt-*`) instead of hardcoded values
- **Class composition**: build complex class strings as arrays with `.join(" ")`:

```typescript
const baseClasses = [
  "glass",
  "inline-flex items-center justify-center rounded-full",
  interactiveClasses,
  "hover:brightness-110 active:scale-110",
].join(" ");
```

- Reusable class combinations live in shared constants
- **Glass morphism**: use the `.glass` CSS class for elevated UI elements
- No CSS-in-JS — use Tailwind utilities; inline styles are acceptable only for truly dynamic values (e.g., user-selected colors)

---

## Headless UI

### References

- Headless UI docs: https://headlessui.com/
- Radix UI docs: https://www.radix-ui.com/primitives/docs/overview/introduction

### Conventions

- **Headless UI** is the primary UI primitive library for interactive elements (buttons, dialogs, menus, popovers, tabs, checkboxes)
- Shared wrappers live in `src/components/ui/` with consistent glass styling
- Native `<input>` elements are used directly — no wrapping needed
- Ensure accessibility: ARIA attributes, keyboard navigation, semantic HTML
- For the className merging approach used in UI wrappers, follow the existing pattern in `src/components/ui/`

---

## IndexedDB / idb

### References

- idb library: https://github.com/nicolo-ribaudo/idb

### Conventions

- Schema defined in `src/data/db/schema.ts` using `DBSchema` interface
- **Singleton pattern**: use `getDB()` from `src/data/db/index.ts` — don't create new connections
- **API layer**: all IndexedDB operations go through `src/data/api/` — one file per domain. Components should not access IndexedDB directly.
- **Version migrations**: check for store/index existence before creating in `upgrade()`, increment DB version for schema changes
- Use `0 | 1` for boolean-like indexed fields

---

## Project Architecture

### File Organization

```
src/
├── components/      # React components (feature folders)
│   └── ui/          # Shared UI primitives (Button, Dialog, etc.)
├── data/
│   ├── api/         # IndexedDB API wrappers
│   ├── db/          # DB schema & initialization
│   ├── hooks/       # TanStack Query hooks
│   └── constants/   # Data constants
├── types/           # TypeScript type definitions
├── utils/           # Pure utility functions
├── routes/          # TanStack Router route definitions
└── index.css        # Global styles + Tailwind @theme
```

### Key Rules

- **Layer separation**: `Components → Hooks → API → IndexedDB`. Exception: form validation may call API methods directly.
- **Naming**: PascalCase for components, camelCase for utilities/hooks, enforced by Biome
- **Barrel exports**: use `index.ts` files for clean imports (`src/types/`, `src/components/ui/`, `src/utils/`)
- **Build**: `npm run build` (TypeScript + Vite), `npm run lint` (Biome), `npm run format` (Biome auto-fix)
