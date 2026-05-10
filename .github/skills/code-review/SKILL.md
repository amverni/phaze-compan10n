---
name: code-review
description: Use when reviewing pull requests, evaluating code quality, or writing React/TypeScript code in the Phase 10 scoreboard app
---

# Code Review Orchestrator

Use this as the review lead. The lead scopes the diff, assigns focused expert reviewers, synthesizes their findings, and returns one consolidated review. Expert details live in separate `code-review-*` skills so each sub-agent can stay focused.

---

## Orchestration Rules

- For broad or multi-area PRs, dispatch one independent sub-agent per relevant expert skill.
- Give each expert sub-agent only its own skill name and scoped review task; do not give expert sub-agents this orchestrator skill as their main guidance.
- For narrow changes, run only the relevant expert skills, but still report coverage.
- If sub-agents are unavailable, run expert skills sequentially yourself, one skill at a time, and do not mix lenses in a single pass.
- Do not declare code clean unless every relevant expert skill has completed and synthesis found no remaining issues.
- Final findings must be concrete: real bugs, type-safety holes, broken accessibility/UX, broken data flow, performance regressions, domain consistency warnings, or explicit project convention violations.

---

## Workflow

1. **Scope the diff** — list changed files and concepts touched.
2. **Select experts** — use every applicable row in the Expert Selection Matrix. One snippet can trigger multiple experts.
3. **Dispatch experts** — launch independent sub-agents with the matching `code-review-*` skill.
4. **Collect outputs** — require findings with file/line/evidence/fix, or `No findings in scope.`
5. **Synthesize** — dedupe, verify against the diff, assign severity, remove speculative/preference-only comments, and resolve conflicts.
6. **Report** — return consolidated findings plus expert coverage.

Sub-agent prompt shape:

```text
Use the <code-review-*> skill. Review only <area> concerns for this PR.
Return concrete findings with severity, file/line, evidence, why it matters,
and a fix, or "No findings in scope." Do not comment outside your expert scope.
```

---

## Expert Selection Matrix

| Expert skill | Use when changed code touches |
| --- | --- |
| `code-review-react` | Components, hooks, render behavior, state ownership, effects, lists, component performance |
| `code-review-performance` | Render-heavy screens, lists, animations, drag/drop, repeated computations, query invalidation, IndexedDB reads/writes |
| `code-review-typescript` | `src/types`, props, API/hook signatures, generics, casts, nullability, discriminated unions, domain identifiers |
| `code-review-routing` | Route files, navigation, generated route tree, hash-history compatibility |
| `code-review-tanstack-query` | Query hooks, keys, options, mutations, invalidation, cache behavior |
| `code-review-tanstack-form` | Submitted forms, validation, field state, submit/reset behavior |
| `code-review-data-architecture` | Components/routes choosing, filtering, sorting, aggregating, or transforming persisted data |
| `code-review-domain-game-rules` | Scoring, rounds, phases, phase completion, skips, wilds, winners, tiebreakers, player state, game completion |
| `code-review-indexeddb` | IndexedDB schema, stores, indexes, migrations, persisted records, batch persistence |
| `code-review-ui-headless` | UI primitives, Headless UI wrappers, controls, dialogs, listboxes, switches, tabs, buttons, repeated UI structures |
| `code-review-accessibility` | Forms, dialogs, popovers, keyboard access, focus behavior, ARIA, labels, disabled states, motion |
| `code-review-ux-product-flow` | Setup/play flows, empty/loading/error states, destructive actions, mobile/touch behavior, back/cancel behavior, recovery paths |
| `code-review-styling-tailwind` | Tailwind CSS v4 classes, theme colors, glass UI, class composition, layout state |
| `code-review-icons` | New/changed icons, icon buttons, character-based icons, inline SVGs, icon accessibility |

---

## Synthesis Rules

- Drop findings that are speculative, preference-only, outside the expert's scope, or unsupported by code evidence.
- Dedupe overlapping findings by keeping the clearest evidence and most actionable fix.
- Resolve conflicts by checking the code and project conventions directly; do not average expert opinions.
- Domain/Game Rules outputs may be `Bug`, `Warning`, `Question`, or `No finding`. Intentional custom rules are not bugs unless they contradict app intent or internal consistency.
- Severity labels: `Critical` for crashes/data loss/inaccessible core flows/impossible game state; `Important` for concrete bugs or convention violations; `Suggestion` for low-risk maintainability improvements; `Warning/Question` for domain or UX ambiguity.

---

## Final Review Format

```markdown
## Findings

- [Severity] file:line — Title
  Evidence:
  Why it matters:
  Suggested fix:

## Expert Coverage

- code-review-react: No findings in scope
- code-review-typescript: 1 Important finding
```

If there are no findings, say so only after listing every relevant expert skill that ran.

---

## Common Orchestrator Mistakes

| Mistake | Correction |
| --- | --- |
| Giving every sub-agent this full orchestrator skill | Give each expert only its matching `code-review-*` skill. |
| Running one broad reviewer over a broad PR | Dispatch independent expert sub-agents. |
| Skipping an expert because another expert might notice it | Use every matching row in the matrix. |
| Returning raw expert output | Synthesize, dedupe, verify, and remove unsupported comments. |
| Calling a PR clean after partial coverage | Clean requires every relevant expert skill to complete. |
