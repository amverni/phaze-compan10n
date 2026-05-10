---
name: code-review-indexeddb
description: Use when reviewing IndexedDB schemas, idb stores, indexes, migrations, persisted records, or batch persistence operations
---

# IndexedDB / idb Code Review Expert

Review only IndexedDB persistence concerns.

## Review Focus

- Indexed fields: use `0 | 1` instead of `boolean` for boolean-like IndexedDB fields used in `createIndex()`. Plain non-indexed `boolean` fields are not covered by this rule.
- Version migrations: in `upgrade()`, every `createObjectStore()` must be guarded by `db.objectStoreNames.contains(...)`.
- Every `createIndex()` added to an existing store must be guarded by `indexNames.contains(...)`; indexes created inside a newly-created store branch are already covered by the store guard.
- Increment DB version for schema changes.
- Use transactions for batch operations, as in `deleteByGameId` in `src/data/api/rounds.ts`.
- Check store/index names, migration ordering, record shape compatibility, and data-loss risks.

## Output

Return `No findings in scope.` or findings with severity, file/line, evidence, persistence risk, and a concrete fix.
