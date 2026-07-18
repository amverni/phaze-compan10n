# Matt Pocock Skills Setup Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure this repo for Matt Pocock's engineering skills and make Matt's `code-review` workflow canonical while preserving Phase 10 review standards.

**Architecture:** Keep Matt's installed plugin as the workflow layer and put repo-specific configuration in `AGENTS.md` plus focused `docs/agents/*.md` files. Rename the existing project `code-review` skill to a non-conflicting Phase 10 deep-review helper, and move the review priorities it protected into `docs/agents/code-review-standards.md` so Matt's Standards axis can cite them.

**Tech Stack:** Git, GitHub Issues, Matt Pocock agent skills, Superpowers project skills, Markdown docs, Biome, TypeScript/Vite.

---

## File structure

- Create `AGENTS.md`
  - Responsibility: short root entry point for agent skill setup. It should link to detailed docs instead of duplicating them.
- Create `docs/agents/issue-tracker.md`
  - Responsibility: tell Matt skills to use GitHub Issues and document issue, PRD, ticket, triage, and Wayfinder operations.
- Create `docs/agents/triage-labels.md`
  - Responsibility: map Matt's five triage roles to this repo's GitHub labels.
- Create `docs/agents/domain.md`
  - Responsibility: tell Matt skills this is a single-context repo and to read `CONTEXT.md` plus relevant ADRs.
- Create `docs/agents/code-review-standards.md`
  - Responsibility: consolidate Phase 10 review standards for Matt's `code-review` Standards axis.
- Move `.github/skills/code-review/SKILL.md` to `.github/skills/phase10-code-review-matrix/SKILL.md`
  - Responsibility: keep the older expert-agent review matrix available for explicit Phase 10 deep reviews without shadowing Matt's `code-review`.

Do not edit app source files. Do not touch unrelated dirty or untracked files such as `Features.md`.

## Chunk 1: External skills and tracker setup

### Task 1: Record the implementation base

**Files:**
- Local git metadata: `.git/mattpocock-skills-setup-base-ref`

- [ ] **Step 1: Confirm working tree scope**

Run:

```bash
git --no-pager status --short
```

Expected: only pre-existing unrelated files may appear. At the time this plan was written, `Features.md` was untracked and must be left untouched.

- [ ] **Step 2: Record the base commit**

Run:

```bash
git rev-parse HEAD > .git/mattpocock-skills-setup-base-ref
cat .git/mattpocock-skills-setup-base-ref
```

Expected: prints one commit SHA. Use this SHA for any final review diff.

### Task 2: Update and verify the Matt Pocock skills checkout

**Files:**
- External only: `$HOME/.copilot/installed-plugins/_direct/mattpocock--skills`

- [ ] **Step 1: Verify the checkout exists**

Run:

```bash
test -d "$HOME/.copilot/installed-plugins/_direct/mattpocock--skills/.git" && echo "Matt skills checkout found"
```

Expected: prints `Matt skills checkout found`. If it fails, stop and ask whether to reinstall the plugin because installation lives outside this repo.

- [ ] **Step 2: Pull the latest version**

Run:

```bash
git -C "$HOME/.copilot/installed-plugins/_direct/mattpocock--skills" pull --ff-only
```

Expected: exits 0. It may say `Already up to date.` or show a fast-forward update. Do not manually edit files inside this checkout.

- [ ] **Step 3: Verify requested and dependent skills exist**

Run:

```bash
for skill in \
  grill-with-docs \
  to-spec \
  to-tickets \
  wayfinder \
  implement \
  code-review \
  setup-matt-pocock-skills \
  triage \
  tdd \
  prototype \
  research \
  domain-modeling \
  grilling
do
  if ! find "$HOME/.copilot/installed-plugins/_direct/mattpocock--skills/skills" -path "*/$skill/SKILL.md" -print -quit | grep -q .; then
    echo "Missing skill: $skill" >&2
    exit 1
  fi
done
echo "All requested and dependent Matt skills are installed"
```

Expected: prints `All requested and dependent Matt skills are installed`.

### Task 3: Verify or create required GitHub labels

**Files:**
- No repo file changes.
- GitHub labels for `amverni/phaze-compan10n`.

- [ ] **Step 1: Check required labels through the GitHub API**

Run:

```bash
curl -fsSL "https://api.github.com/repos/amverni/phaze-compan10n/labels?per_page=100" | node -e '
const fs = require("node:fs");

const required = [
  "needs-triage",
  "needs-info",
  "ready-for-agent",
  "ready-for-human",
  "wontfix",
  "wayfinder:map",
  "wayfinder:research",
  "wayfinder:prototype",
  "wayfinder:grilling",
  "wayfinder:task",
];

const labels = JSON.parse(fs.readFileSync(0, "utf8"));
const existing = new Set(labels.map((label) => label.name));
const missing = required.filter((label) => !existing.has(label));

if (missing.length === 0) {
  console.log("All required labels exist");
} else {
  console.log(`Missing labels: ${missing.join(", ")}`);
  process.exitCode = 2;
}
'
```

Expected if the repo is ready: prints `All required labels exist`.

If it prints missing labels, continue to Step 2.

- [ ] **Step 2: Create missing labels when `gh` is available**

Run:

```bash
if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI is not available. Create the missing labels manually, then rerun the label check." >&2
  exit 1
fi

create_label() {
  local name="$1"
  local color="$2"
  local description="$3"
  if ! gh label list --repo amverni/phaze-compan10n --limit 100 --json name --jq '.[].name' | grep -Fxq "$name"; then
    gh label create "$name" --repo amverni/phaze-compan10n --color "$color" --description "$description"
  fi
}

create_label "needs-triage" "ededed" "Maintainer needs to evaluate this issue"
create_label "needs-info" "ededed" "Waiting on reporter for more information"
create_label "ready-for-agent" "ededed" "Fully specified and ready for an agent"
create_label "ready-for-human" "ededed" "Requires human implementation"
create_label "wontfix" "ffffff" "Will not be actioned"
create_label "wayfinder:map" "ededed" "Wayfinder map issue"
create_label "wayfinder:research" "ededed" "Wayfinder research child issue"
create_label "wayfinder:prototype" "ededed" "Wayfinder prototype child issue"
create_label "wayfinder:grilling" "ededed" "Wayfinder grilling child issue"
create_label "wayfinder:task" "ededed" "Wayfinder task child issue"
```

Expected: exits 0 after creating only missing labels. If `gh` is unavailable or not authenticated, stop and report the missing labels as a manual prerequisite instead of continuing as if publishing workflows are ready.

- [ ] **Step 3: Re-run the label check**

Run:

```bash
curl -fsSL "https://api.github.com/repos/amverni/phaze-compan10n/labels?per_page=100" | node -e '
const fs = require("node:fs");

const required = [
  "needs-triage",
  "needs-info",
  "ready-for-agent",
  "ready-for-human",
  "wontfix",
  "wayfinder:map",
  "wayfinder:research",
  "wayfinder:prototype",
  "wayfinder:grilling",
  "wayfinder:task",
];

const labels = JSON.parse(fs.readFileSync(0, "utf8"));
const existing = new Set(labels.map((label) => label.name));
const missing = required.filter((label) => !existing.has(label));

if (missing.length === 0) {
  console.log("All required labels exist");
} else {
  console.log(`Missing labels: ${missing.join(", ")}`);
  process.exitCode = 2;
}
'
```

Expected: prints `All required labels exist`.

## Chunk 2: Repo agent configuration and code-review refactor

### Task 4: Add Matt skills setup docs

**Files:**
- Create: `AGENTS.md`
- Create: `docs/agents/issue-tracker.md`
- Create: `docs/agents/triage-labels.md`
- Create: `docs/agents/domain.md`

- [ ] **Step 1: Create the docs directory**

Run:

```bash
mkdir -p docs/agents
```

Expected: exits 0.

- [ ] **Step 2: Add `AGENTS.md`**

Use `apply_patch`:

```patch
*** Begin Patch
*** Add File: AGENTS.md
+# Agent Instructions
+
+## Agent skills
+
+### Issue tracker
+
+Issues, specs, tickets, triage work, and wayfinder maps are tracked in GitHub Issues for `amverni/phaze-compan10n`. See `docs/agents/issue-tracker.md`.
+
+### Triage labels
+
+Matt Pocock skills use the default triage label vocabulary. See `docs/agents/triage-labels.md`.
+
+### Domain docs
+
+This is a single-context repo: read `CONTEXT.md` and relevant ADRs under `docs/adr/` before domain-sensitive work. See `docs/agents/domain.md`.
+
+### Code review standards
+
+Matt Pocock's `code-review` skill is the canonical `/code-review` workflow. Its Standards axis must include `docs/agents/code-review-standards.md`, `.github/copilot-instructions.md`, root `CONTEXT.md`, and relevant ADRs as standards sources.
*** End Patch
```

- [ ] **Step 3: Add `docs/agents/issue-tracker.md`**

Use `apply_patch`:

```patch
*** Begin Patch
*** Add File: docs/agents/issue-tracker.md
+# Issue tracker: GitHub
+
+Issues, PRDs/specs, implementation tickets, triage work, and Wayfinder maps for this repo live as GitHub Issues in `amverni/phaze-compan10n`.
+
+Use the `gh` CLI for write operations when it is available and authenticated. If `gh` is unavailable, stop before publishing or mutating issues and report the manual prerequisite.
+
+## Conventions
+
+- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
+- **Read an issue**: `gh issue view <number> --comments`, fetching labels and relevant comments.
+- **List issues**: `gh issue list --state open --json number,title,body,labels,comments` with appropriate `--label` and `--state` filters.
+- **Comment on an issue**: `gh issue comment <number> --body "..."`
+- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
+- **Close**: `gh issue close <number> --comment "..."`
+
+Infer the repo from `git remote -v`; `gh` does this automatically when run inside this clone.
+
+## Pull requests as a triage surface
+
+**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_
+
+When set to `yes`, PRs run through the same labels and states as issues, using the `gh pr` equivalents:
+
+- **Read a PR**: `gh pr view <number> --comments` and `gh pr diff <number>` for the diff.
+- **List external PRs for triage**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments`, then keep only external contributors.
+- **Comment / label / close**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.
+
+GitHub shares one number space across issues and PRs, so a bare `#42` may be either. Resolve with `gh pr view 42` and fall back to `gh issue view 42`.
+
+## When a skill says "publish to the issue tracker"
+
+Create a GitHub issue.
+
+## When a skill says "fetch the relevant ticket"
+
+Run `gh issue view <number> --comments`.
+
+## Wayfinding operations
+
+Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.
+
+- **Map**: a single issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body. Create with `gh issue create --label wayfinder:map`.
+- **Child ticket**: an issue linked to the map as a GitHub sub-issue. Where sub-issues are unavailable, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`).
+- **Blocking**: use GitHub native issue dependencies when available. Where dependencies are unavailable, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body.
+- **Frontier query**: list the map's open children, drop any with an open blocker or assignee, and take the first in map order.
+- **Claim**: `gh issue edit <n> --add-assignee @me` before doing ticket work.
+- **Resolve**: `gh issue comment <n> --body "<answer>"`, close the issue, then append a context pointer to the map's Decisions-so-far.
*** End Patch
```

- [ ] **Step 4: Add `docs/agents/triage-labels.md`**

Use `apply_patch`:

```patch
*** Begin Patch
*** Add File: docs/agents/triage-labels.md
+# Triage Labels
+
+The Matt Pocock skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's GitHub issue tracker.
+
+| Label in mattpocock/skills | Label in our tracker | Meaning |
+| --- | --- | --- |
+| `needs-triage` | `needs-triage` | Maintainer needs to evaluate this issue |
+| `needs-info` | `needs-info` | Waiting on reporter for more information |
+| `ready-for-agent` | `ready-for-agent` | Fully specified, ready for an AFK agent |
+| `ready-for-human` | `ready-for-human` | Requires human implementation |
+| `wontfix` | `wontfix` | Will not be actioned |
+
+When a skill mentions a role, use the corresponding label string from this table.
*** End Patch
```

- [ ] **Step 5: Add `docs/agents/domain.md`**

Use `apply_patch`:

```patch
*** Begin Patch
*** Add File: docs/agents/domain.md
+# Domain Docs
+
+How Matt Pocock's engineering skills should consume this repo's domain documentation when exploring the codebase.
+
+## Before exploring, read these
+
+- **`CONTEXT.md`** at the repo root.
+- **`docs/adr/`** for ADRs that touch the area about to be changed or reviewed.
+
+If any of these files do not exist, proceed silently. Do not flag their absence or suggest creating them upfront. The `/domain-modeling` skill, reached through `/grill-with-docs` and architecture work, creates or updates domain docs lazily when terms or decisions actually get resolved.
+
+## File structure
+
+This is a single-context repo:
+
+```text
+/
+├── CONTEXT.md
+├── docs/adr/
+└── src/
+```
+
+## Use the glossary's vocabulary
+
+When output names a domain concept in an issue title, spec, ticket, review finding, refactor proposal, hypothesis, test name, or implementation note, use the term as defined in `CONTEXT.md`. Do not drift to synonyms the glossary explicitly avoids.
+
+If the concept needed is not in the glossary, either reconsider whether the language belongs in this repo or note the gap for `/domain-modeling`.
+
+## Flag ADR conflicts
+
+If output contradicts an existing ADR, surface it explicitly instead of silently overriding it.
*** End Patch
```

- [ ] **Step 6: Commit setup docs**

Run:

```bash
git add AGENTS.md docs/agents/issue-tracker.md docs/agents/triage-labels.md docs/agents/domain.md
git commit -m "Configure Matt Pocock agent setup" \
  -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>" \
  -m "Copilot-Session: 2cb818d4-25a0-4216-908c-ae1b3823382e"
```

Expected: commit succeeds with only the four setup docs staged.

### Task 5: Add Phase 10 code-review standards for Matt's Standards axis

**Files:**
- Create: `docs/agents/code-review-standards.md`

- [ ] **Step 1: Add the standards document**

Use `apply_patch`:

```patch
*** Begin Patch
*** Add File: docs/agents/code-review-standards.md
+# Code Review Standards
+
+Matt Pocock's `code-review` skill is the canonical `/code-review` workflow for this repo. Its Standards axis must include this file along with `.github/copilot-instructions.md`, `CONTEXT.md`, relevant ADRs under `docs/adr/`, and any focused `.github/skills/code-review-*` skill that matches the changed area.
+
+This file adds Phase 10 scoreboard standards on top of Matt's fixed smell baseline. It does not replace the Spec axis.
+
+## Architecture and data flow
+
+- Preserve the data flow: `Routes -> Components -> TanStack Query hooks -> API layer -> IndexedDB`.
+- Keep route files thin. Delegate UI and workflow logic to components.
+- Never edit `src/routeTree.gen.ts` manually; it is generated by the TanStack Router plugin.
+- Preserve GitHub Pages hash-history compatibility for navigation and share URLs.
+- Components should not orchestrate persistence queries or transform raw persisted data. Filtering, sorting, aggregation, random sampling, and persisted-data selection belong in `src/data/api/`.
+- Built-in constants should be merged with user-created data at the API layer, not in components.
+
+## React, TypeScript, and TanStack
+
+- React Compiler is enabled. Do not recommend routine `useMemo` or `useCallback`; flag manual memoization only when it creates bugs or when there is a concrete identity-stability issue the compiler will not solve.
+- Avoid duplicated React state that can drift from props, query data, form state, or persisted data.
+- Effects should synchronize with external systems, not compute render data that belongs in render, API, or query layers.
+- Use stable domain identifiers for list keys when order can change.
+- Preserve discriminated unions for state variants, such as `Game = ActiveGame | CompletedGame` via `status`.
+- Prefer precise domain types such as `GameId`, `PlayerId`, and `PhaseSetId` over anonymous `string` in public app/API boundaries.
+- Avoid `as any`, broad `unknown as ...`, and casts that hide invalid data flow. Generated files such as `src/routeTree.gen.ts` are exempt.
+- Export reusable public types through `src/types/index.ts`.
+- Use TanStack Query as a local cache over IndexedDB, not as a network cache.
+- Use query key factory objects with hierarchical keys and centralize query config with `queryOptions()`.
+- Mutations should invalidate related queries using the broadest relevant key without excessive invalidation.
+- Preserve local-first Query defaults from project conventions: `staleTime: Infinity`, `retry: false`, and no focus/reconnect refetch unless explicitly justified.
+- Use TanStack Form for submitted forms. Do not manage submitted field state with raw `useState`.
+- Keep cheap validation inline on fields and async domain validation in API calls on submit.
+
+## Persistence and domain rules
+
+- IndexedDB access goes through `src/data/api/`; components never touch the database directly.
+- Use `0 | 1` instead of `boolean` for boolean-like IndexedDB fields used in indexes. Plain non-indexed booleans are not covered by this rule.
+- In DB upgrades, guard `createObjectStore()` with `db.objectStoreNames.contains(...)`.
+- Guard `createIndex()` additions to existing stores with `indexNames.contains(...)`.
+- Increment the DB version for schema changes.
+- Use transactions for batch operations and avoid unnecessary IndexedDB scans when an index or API-level selection is appropriate.
+- Protect Phase 10 scoreboard consistency around scoring, rounds, phase completion, Round Skips, Sit Out, Turn Skips, Skip Cards, wilds, active/removed players, winner selection, Tiebreakers, and game completion.
+- Do not flag intentional custom rules as bugs solely because they differ from the physical card game. Flag contradictions with app requirements, persisted state invariants, or internal consistency.
+- Use domain terms from `CONTEXT.md`, including **Game**, **Active Game**, **Completed Game**, **Player**, **Phase**, **Phase Set**, **Phases Card**, **Round**, **Round Winner**, **Game Winner**, **Tiebreaker**, **Round Skip**, **Sit Out**, **Turn Skip**, and **Skip Card**.
+
+## UI, accessibility, styling, and UX
+
+- Prefer shared UI primitives in `src/components/ui/` over raw native controls or direct Headless UI imports when a wrapper exists.
+- Wrappers should carry shared glass styling, interactive states, and accessibility behavior. Pass additional classes through `className`.
+- Preserve keyboard access, focus trap/restore, visible focus, predictable tab order, accessible names, semantic roles, ARIA correctness, form labels, field errors, disabled affordances, and reduced-motion expectations.
+- Check setup and play flows for clear empty, loading, error, retry, recovery, destructive-action, mobile/touch, back, and cancel behavior.
+- Use Tailwind CSS v4 theme tokens from `src/index.css` instead of hardcoded color values.
+- Use `.glass` for elevated UI elements.
+- Build complex class strings as arrays with `.join(" ")`.
+- Keep reusable class combinations in shared constants when the same styling behavior appears in multiple places.
+- Use the project's icon libraries instead of text-character icons or hand-rolled inline SVGs when a library icon exists.
+- Icon buttons need accessible names. Decorative icons should be hidden from assistive tech.
+
+## Performance review expectations
+
+- Tie performance findings to observed code paths or likely app behavior, not theoretical micro-optimizations.
+- Watch render-heavy components, score tables, long lists, animated list reordering, drag/drop, repeated derived computations, broad Query invalidation, cache churn, IndexedDB scans, missing indexes, and missing transactions for batch writes.
+- Prefer architectural fixes over manual memoization: move repeated data selection to the API/query layer, narrow invalidation when correct, and batch persistence work.
+
+## Manual deep-review option
+
+For explicit Phase 10 expert-matrix deep reviews, use the `phase10-code-review-matrix` project skill. Matt's `code-review` remains the default `/code-review` workflow.
*** End Patch
```

- [ ] **Step 2: Verify the standards mention every focused review lens**

Run:

```bash
for term in \
  "React Compiler" \
  "domain types" \
  "data flow" \
  "TanStack Query" \
  "TanStack Form" \
  "IndexedDB" \
  "Phase 10 scoreboard" \
  "hash-history" \
  "keyboard access" \
  "Headless UI" \
  "empty, loading, error" \
  "Tailwind CSS v4" \
  "icon" \
  "Performance"
do
  if ! grep -Fq "$term" docs/agents/code-review-standards.md; then
    echo "Missing standards term: $term" >&2
    exit 1
  fi
done
echo "Code review standards cover the expected lenses"
```

Expected: prints `Code review standards cover the expected lenses`.

- [ ] **Step 3: Commit standards doc**

Run:

```bash
git add docs/agents/code-review-standards.md
git commit -m "Document Phase 10 code review standards" \
  -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>" \
  -m "Copilot-Session: 2cb818d4-25a0-4216-908c-ae1b3823382e"
```

Expected: commit succeeds with only `docs/agents/code-review-standards.md` staged.

### Task 6: Rename the project code-review matrix skill

**Files:**
- Move: `.github/skills/code-review/SKILL.md` -> `.github/skills/phase10-code-review-matrix/SKILL.md`

- [ ] **Step 1: RED check the current skill-name conflict**

Run:

```bash
grep -Rsn --include='SKILL.md' '^name: code-review$' .github/skills
```

Expected before implementation: finds `.github/skills/code-review/SKILL.md:2:name: code-review`. This confirms the project skill currently conflicts with Matt's canonical `code-review` name.

- [ ] **Step 2: Move the skill folder**

Run:

```bash
git mv .github/skills/code-review .github/skills/phase10-code-review-matrix
```

Expected: command exits 0.

- [ ] **Step 3: Update the renamed skill frontmatter and intro**

Use `apply_patch`:

```patch
*** Begin Patch
*** Update File: .github/skills/phase10-code-review-matrix/SKILL.md
@@
-name: code-review
-description: Use when reviewing pull requests, evaluating code quality, or writing React/TypeScript code in the Phase 10 scoreboard app
+name: phase10-code-review-matrix
+description: Use when explicitly requesting the Phase 10 expert-matrix review rather than Matt Pocock's default code-review workflow
@@
-# Code Review Orchestrator
+# Phase 10 Code Review Matrix
 
-Use this as the review lead. The lead scopes the diff, assigns focused expert reviewers, synthesizes their findings, and returns one consolidated review. Expert details live in separate `code-review-*` skills so each sub-agent can stay focused.
+Matt Pocock's `code-review` skill is the canonical `/code-review` workflow for this repo. Use this helper only when a human explicitly asks for the older Phase 10 expert-matrix deep review.
+
+This helper scopes the diff, assigns focused Phase 10 expert reviewers, synthesizes their findings, and returns one consolidated review. Expert details live in separate `code-review-*` skills so each sub-agent can stay focused.
*** End Patch
```

- [ ] **Step 4: GREEN check there is no project skill named exactly `code-review`**

Run:

```bash
if grep -Rsn --include='SKILL.md' '^name: code-review$' .github/skills; then
  echo "Unexpected project skill named code-review remains" >&2
  exit 1
else
  echo "No project skill named code-review remains"
fi
```

Expected: prints `No project skill named code-review remains`.

- [ ] **Step 5: Verify the renamed helper is discoverable**

Run:

```bash
grep -Fq 'name: phase10-code-review-matrix' .github/skills/phase10-code-review-matrix/SKILL.md
grep -Fq "Matt Pocock's \`code-review\` skill is the canonical" .github/skills/phase10-code-review-matrix/SKILL.md
grep -Fq 'Expert Selection Matrix' .github/skills/phase10-code-review-matrix/SKILL.md
echo "Renamed helper is discoverable"
```

Expected: prints `Renamed helper is discoverable`.

- [ ] **Step 6: Commit skill rename**

Run:

```bash
git add .github/skills/phase10-code-review-matrix/SKILL.md
git commit -m "Rename Phase 10 code review matrix skill" \
  -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>" \
  -m "Copilot-Session: 2cb818d4-25a0-4216-908c-ae1b3823382e"
```

Expected: commit records a rename from `.github/skills/code-review/SKILL.md` to `.github/skills/phase10-code-review-matrix/SKILL.md`.

### Task 7: Final validation

**Files:**
- No new file changes unless validation exposes issues.

- [ ] **Step 1: Verify agent setup links**

Run:

```bash
set -e

for path in \
  AGENTS.md \
  docs/agents/issue-tracker.md \
  docs/agents/triage-labels.md \
  docs/agents/domain.md \
  docs/agents/code-review-standards.md
do
  test -f "$path" || { echo "Missing $path" >&2; exit 1; }
done

grep -Fq "docs/agents/code-review-standards.md" AGENTS.md
grep -Fq "GitHub Issues" docs/agents/issue-tracker.md
grep -Fq "ready-for-agent" docs/agents/triage-labels.md
grep -Fq "CONTEXT.md" docs/agents/domain.md
echo "Agent setup docs are linked"
```

Expected: prints `Agent setup docs are linked`.

- [ ] **Step 2: Verify Matt and project code-review names do not conflict**

Run:

```bash
set -e

if grep -Rsn --include='SKILL.md' '^name: code-review$' .github/skills; then
  echo "Unexpected project code-review skill remains" >&2
  exit 1
fi

find "$HOME/.copilot/installed-plugins/_direct/mattpocock--skills/skills" -path "*/code-review/SKILL.md" -print -quit | grep -q .
echo "Matt code-review is installed and project code-review name is clear"
```

Expected: prints `Matt code-review is installed and project code-review name is clear`.

- [ ] **Step 3: Run lint**

Run:

```bash
npm run lint
```

Expected: exits 0.

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 5: Inspect final diff**

Run:

```bash
git --no-pager diff --stat "$(cat .git/mattpocock-skills-setup-base-ref)"..HEAD
git --no-pager status --short
```

Expected: diff contains only this setup work and the previously committed spec/plan work. `Features.md` may still appear as unrelated untracked work and must remain untouched.

- [ ] **Step 6: Commit final fixes if validation required edits**

If any validation step required follow-up edits, commit only those edits:

```bash
git --no-pager status --short
git add AGENTS.md \
  docs/agents/issue-tracker.md \
  docs/agents/triage-labels.md \
  docs/agents/domain.md \
  docs/agents/code-review-standards.md \
  .github/skills/phase10-code-review-matrix/SKILL.md
git commit -m "Validate Matt Pocock skills setup" \
  -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>" \
  -m "Copilot-Session: 2cb818d4-25a0-4216-908c-ae1b3823382e"
```

Expected: no commit is needed if validation required no edits.
