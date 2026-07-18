# Matt Pocock Skills Setup Design

## Goal

Update the repo so Matt Pocock's engineering skills can run with clear project configuration, and make Matt's `code-review` skill the canonical `/code-review` workflow while preserving the Phase 10 scoreboard review concerns that the existing project review skill covers.

## Scope

In scope:

- Update the installed `mattpocock/skills` checkout to the latest available version.
- Configure the repo for Matt's skills with agent-facing docs under `docs/agents/`.
- Create an `AGENTS.md` entry point that tells agents where issue tracker, triage label, domain-doc, and code-review standards live.
- Use GitHub Issues as the configured issue tracker for specs, tickets, triage, and wayfinder maps.
- Use the default Matt Pocock triage labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`.
- Treat this repo as a single-context project with root `CONTEXT.md` and ADRs under `docs/adr/`.
- Refactor the project code-review setup so Matt's `code-review` skill owns `/code-review`, and Phase 10-specific review priorities are included in Matt's Standards axis.

Out of scope:

- Changing app runtime behavior, routing, UI, IndexedDB data, or build tooling.
- Creating GitHub labels or issues as part of setup.
- Replacing the existing Phase 10 expert review lenses with generic advice.
- Adding a test framework.
- Changing Matt Pocock's installed plugin source files.

## Existing context

The repo already has strong project guidance:

- `.github/copilot-instructions.md` documents build commands, architecture, React/TanStack conventions, TypeScript/data conventions, and Tailwind/glass styling rules.
- `CONTEXT.md` defines the Phase 10 scoreboard domain language.
- `docs/adr/` contains repo decisions, currently including the self-contained Phases Card sharing URL decision.
- `.github/skills/code-review` currently defines a project-level review orchestrator that selects focused `code-review-*` expert skills.
- `.github/skills/code-review-*` expert skills define focused review concerns for React, TypeScript, data architecture, domain game rules, IndexedDB, TanStack Query/Form, routing, accessibility, UI primitives, UX flow, performance, styling, and icons.

The latest `mattpocock/skills` plugin includes the requested skills:

- `grill-with-docs`
- `to-spec`
- `to-tickets`
- `wayfinder`
- `implement`
- `code-review`

It also includes the dependent skills needed by those workflows, including `setup-matt-pocock-skills`, `triage`, `tdd`, `prototype`, `research`, `domain-modeling`, and `grilling`.

## Approved direction

Use Matt's skills as the canonical workflow layer, and move repo-specific behavior into docs that those skills can consume.

The key design choice is to avoid two top-level skills named `code-review`. Matt's `code-review` should be the `/code-review` entry point. The current project review orchestrator should be renamed to a Phase 10-specific helper skill, while its review priorities are consolidated into a standards document that Matt's Standards axis must include.

This keeps Matt's two-axis review model intact:

- **Standards**: review the diff against documented repo standards, Phase 10-specific review rules, and Matt's Fowler smell baseline.
- **Spec**: review the diff against the originating issue, PRD, or spec.

## Repo setup docs

Add `docs/agents/issue-tracker.md` from the Matt GitHub issue tracker template. It should state that issues, PRDs/specs, tickets, triage, and wayfinder maps live in GitHub Issues for `amverni/phaze-compan10n`.

The GitHub tracker doc should keep Matt's default "PRs as a request surface: no" flag. It should include the GitHub issue operations and wayfinder map/child/blocking conventions from the latest Matt template.

Add `docs/agents/triage-labels.md` from the Matt default triage label template. The repo should use the default mapping:

| Matt role | Tracker label |
| --- | --- |
| `needs-triage` | `needs-triage` |
| `needs-info` | `needs-info` |
| `ready-for-agent` | `ready-for-agent` |
| `ready-for-human` | `ready-for-human` |
| `wontfix` | `wontfix` |

Add `docs/agents/domain.md` from the Matt domain-doc template. It should configure this as a single-context repo:

- read root `CONTEXT.md` before domain-sensitive work,
- read relevant ADRs under `docs/adr/`,
- use the glossary's vocabulary in issues, specs, tickets, review findings, and implementation notes,
- surface conflicts with ADRs explicitly.

## AGENTS.md

Create `AGENTS.md` at the repo root because neither `AGENTS.md` nor `CLAUDE.md` currently exists.

The file should include an `## Agent skills` block with:

- **Issue tracker**: GitHub Issues for `amverni/phaze-compan10n`, pointing to `docs/agents/issue-tracker.md`.
- **Triage labels**: default Matt Pocock labels, pointing to `docs/agents/triage-labels.md`.
- **Domain docs**: single-context layout, pointing to `docs/agents/domain.md`.
- **Code review standards**: Matt's `code-review` Standards axis must include `docs/agents/code-review-standards.md`, `.github/copilot-instructions.md`, root `CONTEXT.md`, and relevant ADRs.

The `AGENTS.md` guidance should stay short and route details to `docs/agents/*.md`.

## Code review integration

Add `docs/agents/code-review-standards.md` as the bridge between Matt's `code-review` skill and this repo's existing review priorities.

The standards document should consolidate the review concerns currently spread across the project `code-review-*` skills:

- preserve the route-to-database data flow: `Routes -> Components -> TanStack Query hooks -> API layer -> IndexedDB`;
- keep route files thin and do not edit `src/routeTree.gen.ts` manually;
- keep React Compiler conventions, especially avoiding routine `useMemo`/`useCallback`;
- avoid duplicated React state that can drift from props, query data, form state, or persisted data;
- preserve precise TypeScript/domain IDs and discriminated unions;
- avoid unsafe casts such as `as any` or broad `unknown as ...`;
- keep persisted reads/writes in the data API layer and expose UI data through TanStack Query hooks;
- preserve local-first TanStack Query defaults and invalidate broad relevant keys after mutations;
- use TanStack Form for forms and keep async domain validation on submit;
- protect IndexedDB schema, indexes, migrations, batch persistence, and `0 | 1` indexed flags;
- protect Phase 10 game-rule consistency around scoring, rounds, phases, skips, wilds, winners, tiebreakers, player state, and game completion;
- preserve accessibility for forms, dialogs, popovers, keyboard access, focus behavior, ARIA, labels, disabled states, and motion;
- prefer shared UI primitives and Headless UI wrappers where they carry project behavior;
- preserve mobile/touch flows, empty/loading/error states, destructive-action recovery, and back/cancel behavior;
- use Tailwind v4 theme tokens, `.glass`, and array-based class composition;
- review changed icons and icon buttons for accessible labels and consistent Lucide/project icon usage.

The standards document should not replace Matt's smell baseline. It should add repo-specific standards that Matt's Standards sub-agent can cite.

## Project review skill refactor

Rename the existing project skill at `.github/skills/code-review` so it no longer owns the `code-review` skill name.

The renamed helper should use a Phase 10-specific name such as `phase10-code-review-matrix`. It may keep the current expert selection matrix and sub-agent orchestration for manual deep review, but it should clearly state that Matt's `code-review` is the default `/code-review` workflow.

Keep the focused `.github/skills/code-review-*` expert skills. They remain useful as supporting material and as manual deep-review lenses. They should not conflict with Matt's `code-review` because their names are already specific.

## Expected behavior

After implementation:

- Agents can run Matt's `grill-with-docs`, `to-spec`, `to-tickets`, `wayfinder`, `implement`, and `code-review` without asking for setup first.
- `to-spec` and `to-tickets` can publish to GitHub Issues and apply the `ready-for-agent` label.
- `wayfinder` can create map issues and child decision tickets using the GitHub tracker conventions.
- `triage` can use the default label vocabulary.
- `grill-with-docs`, `domain-modeling`, and architecture-oriented skills know to use root `CONTEXT.md` and `docs/adr/`.
- Matt's `code-review` can run its Standards and Spec axes, and the Standards axis has access to the Phase 10-specific review priorities.
- The old Phase 10 expert review matrix remains available under a non-conflicting helper skill name for deeper manual review.

## Implementation boundaries

Expected file changes:

- Create `AGENTS.md`.
- Create `docs/agents/issue-tracker.md`.
- Create `docs/agents/triage-labels.md`.
- Create `docs/agents/domain.md`.
- Create `docs/agents/code-review-standards.md`.
- Rename `.github/skills/code-review/SKILL.md` to `.github/skills/phase10-code-review-matrix/SKILL.md`.
- Update the renamed skill frontmatter `name` and description.
- Update the renamed skill body to clarify that Matt's `code-review` is canonical and this helper is for Phase 10 expert-matrix deep dives.

Do not modify app source files for this setup.

Do not duplicate the full Matt `code-review` process in project docs. Project docs should provide standards and repo setup, not fork Matt's skill.

## Error handling and compatibility

If a future agent cannot find Matt's `code-review` after the project skill is renamed, it should re-run the Matt skills installer or inspect the installed plugin before recreating a project-level `code-review` skill.

If GitHub issue dependencies or sub-issues are unavailable, use the fallback conventions already documented in the Matt GitHub issue tracker template.

If a review has no originating spec or issue, Matt's `code-review` should still run Standards and explicitly report that the Spec axis has no spec available.

## Validation

- Confirm the installed `mattpocock/skills` checkout contains the requested skills and dependencies.
- Confirm the repo no longer has a project skill whose frontmatter name is exactly `code-review`.
- Confirm `AGENTS.md` points to the new `docs/agents/*.md` files.
- Confirm `docs/agents/code-review-standards.md` covers the current Phase 10 expert review lenses.
- Run `npm run lint`.
- Run `npm run build`.
