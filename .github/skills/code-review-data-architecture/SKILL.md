---
name: code-review-data-architecture
description: Use when reviewing data flow, API layer boundaries, component-side filtering/sorting/aggregation, or persisted data transformations
---

# Data Architecture Code Review Expert

Review only data flow and separation-of-concerns issues.

## Review Focus

- Follow the established flow: `Routes → Components → TanStack Query hooks → API layer → IndexedDB`.
- Components should not contain data logic: filtering, sorting, aggregation, random sampling, or deciding which persisted data to return belongs in `src/data/api/`.
- Components call API methods and render results; they should not orchestrate persistence queries or transform raw persisted data.
- Design API methods as stable contracts as if they could be backed by a REST endpoint later.
- Keep built-in constants merged with user-created data at the API layer, not in components.

## Output

Return `No findings in scope.` or findings with severity, file/line, evidence, architectural risk, and a concrete fix.
