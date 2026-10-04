---
name: code-review-routing
description: Use when reviewing TanStack Router route files, navigation, route tree generation, or GitHub Pages hash-history compatibility
---

# Routing Code Review Expert

Review only routing concerns in the Phase 10 scoreboard app.

## Review Focus

- File-based routing uses `@tanstack/router-plugin`; route files should stay thin and delegate UI/workflow logic to components.
- `src/routeTree.gen.ts` is generated; never edit it manually.
- Preserve hash history (`/#/path`) compatibility for GitHub Pages.
- Check navigation targets, route params/search state, redirects, and route-level loading/error behavior when changed.

## Output

Return `No findings in scope.` or findings with severity, file/line, evidence, why it matters, and a concrete fix.
