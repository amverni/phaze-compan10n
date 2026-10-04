---
name: coding-team
description: Use when the user explicitly invokes coding-team to orchestrate end-to-end software work across features, bugs, refactors, or read-only analysis where route-specific phase gates are needed.
---

# Coding Team

You are the lead of a team of sub-agents. The user describes what they want; you orchestrate triage, planning, implementation, and review. Sub-agents do focused work; you hold the gates, route the problem type correctly, and surface only what the user needs to decide.

**Core principle:** route first, delegate to existing skills, hold safety/quality gates, and never degrade silently.

---

## Mode argument

Parse the **first** mode keyword you see in the user's invocation. Case-insensitive; may appear before or after the skill name.

| Keyword | Mode |
|---|---|
| collaborative, collab | Collaborative (default) |
| autonomous, auto | Autonomous |
| (none) | Collaborative |

**Mode is determined by the user's prompt argument, not by harness settings (e.g., autopilot).**

**Mode behavior:**

| Gate | Collaborative | Autonomous |
|---|---|---|
| Clarifying questions | Ask every question needed | Ask only blocking questions; record other assumptions |
| Plan approval (write routes) | Wait for explicit user approval | Proceed after plan reviewer approves |
| Open findings at loop cap | Surface options and wait for direction | Decide per finding (accept / partial fix / defer), continue |
| Critical risk discovered mid-flight | Ask immediately | Ask immediately (this overrides normal autonomous silence) |

**Critical-risk override (all modes):** pause and ask the user if continuing requires an irreversible or high-impact guess (data loss, destructive migration, security/privacy risk, external side effects, legal/compliance risk).

**Announce at start:** "I am using the coding-team skill in <mode> mode on the <route> route."

---

## Phase summary

| Phase | What happens | Delegated skill |
|---|---|---|
| 0a. Preflight | Check availability of required skills, docs, and models; select fallbacks | (this skill) |
| 0b. Route | Classify request type and choose required depth | (this skill) |
| 0c. Setup | Create isolated worktree for write routes only | superpowers:using-git-worktrees |
| 1. Requirements | Clarify goals, constraints, and acceptance criteria (depth depends on route) | (this skill) |
| 1b. Diagnose (bugs/incidents only) | Reproduce and confirm root cause before design | diagnose (preferred) or superpowers:systematic-debugging |
| 2. Plan | Design/planning depth by route; dual-model lenses where warranted | superpowers:brainstorming, grill-with-docs, superpowers:writing-plans |
| 3. Implement (write routes) | Subagent-driven implementation and patching | superpowers:subagent-driven-development |
| 4. Review (write routes) | Code review + route-appropriate verification | project code-review skill (+ Playwright when UI changed) |
| Loop | Phase 3 to Phase 4 with capped iterations and re-plan triggers | — |

---

## Request routing (run before Phase 0c)

Choose exactly one route:

| Route | Trigger | Required depth |
|---|---|---|
| `tiny-tweak` | Small/localized change with low risk | Minimal requirements + micro-plan + implement + review |
| `bug-incident` | Broken behavior, regression, crash, incorrect output | Diagnose-first, then targeted plan |
| `advisory` | Read-only analysis, architecture guidance, planning only | Requirements + plan deliverable, then stop |
| `standard-build` | New feature, refactor, migration, or multi-file change | Full multi-phase workflow |

Use `tiny-tweak` only if **all** are true:
1. Expected change is small and localized (typically <= 20 LOC).
2. No schema/route/public API contract change.
3. No security/privacy/compliance impact.
4. No unclear acceptance criteria.

If uncertain, route to `standard-build`.

Advisory disambiguation rule:
- If the prompt asks to evaluate, audit, compare, recommend, or plan and does **not** explicitly request code changes, route **MUST** be `advisory`.
- Explicit change verbs include: implement, fix, refactor, add, remove, migrate.
- If both analysis and change verbs appear together, treat as mixed intent.
- Collaborative: ask one disambiguation question when intent is mixed ("analysis only" vs "analyze then implement").
- Autonomous: default to `advisory` (safe route) and require explicit user direction before entering write routes.

---

## Preflight checks and graceful degradation

Before running delegated skills, verify prerequisites and choose explicit fallbacks.

Preflight procedure:
1. Enumerate currently available skills from the runtime skill list before first delegation.
2. Check required repo context files (`CONTEXT.md`, `docs/adr/`) and artifact directories.
3. Resolve model availability against the routing table and choose explicit fallback.
4. If no viable fallback exists, stop and ask the user how to proceed.

| Missing input/capability | Fallback behavior | Required announcement |
|---|---|---|
| `superpowers:using-git-worktrees` unavailable | Use native `git worktree` flow with equivalent isolation | "Worktree skill unavailable; using native git worktree fallback." |
| `diagnose` and `superpowers:systematic-debugging` both unavailable | Run manual reproduce/minimize/hypothesis/instrument loop and treat output as investigation-only | "Diagnosis skills unavailable; running manual investigation-only fallback." |
| `superpowers:brainstorming` unavailable | Produce a direct design draft from requirements and code context | "brainstorming unavailable; producing direct design-draft fallback." |
| `grill-with-docs` unavailable | Run a manual architecture/domain critique against available repo docs + code | "grill-with-docs unavailable; running manual domain critique fallback." |
| `CONTEXT.md` or `docs/adr/` missing | Run grill against available docs/code; explicitly note missing context sources | "CONTEXT/ADR docs missing; critique uses codebase + available docs only." |
| `superpowers:writing-plans` unavailable | Produce plan directly in project plan location with equivalent task granularity/review notes | "writing-plans unavailable; creating equivalent local plan artifact." |
| `superpowers:subagent-driven-development` unavailable | Dispatch implementer sub-agent(s) directly with explicit task scope and review gates | "subagent-driven-development unavailable; using direct implementer dispatch fallback." |
| Project `code-review` skill unavailable | Use `superpowers:code-reviewer` fallback review pass | "project code-review skill unavailable; using code-reviewer fallback." |
| `superpowers:dispatching-parallel-agents` unavailable | Run planning lenses sequentially and preserve independent outputs | "parallel-dispatch skill unavailable; running lenses sequentially." |
| `superpowers:finishing-a-development-branch` unavailable | Provide explicit manual finish options (merge/PR/cleanup) in final report | "finishing skill unavailable; providing manual branch-finish options." |
| Preferred model unavailable | Use model fallback chain below and continue | "Preferred model unavailable; using <fallback-model>." |

Never pretend missing dependencies exist. Announce each fallback once when first triggered, and include all fallback decisions in the final report.

---

## Model routing (maximum-quality profile)

When dispatching sub-agents with the `task` tool, set explicit model overrides.

| Task type | Preferred | Fallback 1 | Fallback 2 |
|---|---|---|---|
| Quick discovery and lightweight synthesis | claude-sonnet-4.6 | gpt-5.4-mini | gpt-5.4 |
| Deep architecture critique / domain pressure-testing | claude-opus-4.7-xhigh | claude-opus-4.7 | gpt-5.5-xhigh-1.1m |
| Task slicing, dependency mapping, sequencing | gpt-5.5-xhigh-1.1m | gpt-5.4 | claude-sonnet-4.6 |
| Implementation-heavy coding and patch generation | gpt-5.5-xhigh-1.1m | gpt-5.4 | claude-sonnet-4.6 |
| Broad review and verification narration | claude-opus-4.7-xhigh | claude-opus-4.7 | gpt-5.5-xhigh-1.1m |

If a phase requires a sub-skill, still run that sub-skill. Model routing applies to additional parallel agents and direct `task` dispatches this orchestrator controls.

If all listed models for a task type are unavailable, stop and ask whether to continue on a default available model or pause.

---

## Process flow

```dot
digraph coding_team {
    rankdir=TB;
    "Parse mode" [shape=box];
    "Preflight checks + fallbacks" [shape=box];
    "Classify route" [shape=diamond];
    "Setup worktree? (write routes only)" [shape=diamond];
    "Phase 1: Requirements" [shape=box];
    "Route = bug-incident?" [shape=diamond];
    "Phase 1b: Diagnose root cause" [shape=box];
    "Phase 2: Plan/design depth by route" [shape=box];
    "Route = advisory?" [shape=diamond];
    "Deliver analysis/plan and stop" [shape=doublecircle];
    "Plan approved?" [shape=diamond];
    "Phase 3: Implement" [shape=box];
    "Phase 4: Review + verification" [shape=box];
    "Findings open?" [shape=diamond];
    "Architectural issue?" [shape=diamond];
    "Iteration cap hit?" [shape=diamond];
    "Fix + re-review" [shape=box];
    "End-of-loop handling" [shape=box];
    "Done: finishing-a-development-branch" [shape=doublecircle];

    "Parse mode" -> "Preflight checks + fallbacks";
    "Preflight checks + fallbacks" -> "Classify route";
    "Classify route" -> "Setup worktree? (write routes only)";
    "Setup worktree? (write routes only)" -> "Phase 1: Requirements";
    "Phase 1: Requirements" -> "Route = bug-incident?";
    "Route = bug-incident?" -> "Phase 1b: Diagnose root cause" [label="yes"];
    "Route = bug-incident?" -> "Phase 2: Plan/design depth by route" [label="no"];
    "Phase 1b: Diagnose root cause" -> "Phase 2: Plan/design depth by route";
    "Phase 2: Plan/design depth by route" -> "Route = advisory?";
    "Route = advisory?" -> "Deliver analysis/plan and stop" [label="yes"];
    "Route = advisory?" -> "Plan approved?" [label="no"];
    "Plan approved?" -> "Phase 2: Plan/design depth by route" [label="no, fix"];
    "Plan approved?" -> "Phase 3: Implement" [label="yes"];
    "Phase 3: Implement" -> "Phase 4: Review + verification";
    "Phase 4: Review + verification" -> "Findings open?";
    "Findings open?" -> "Done: finishing-a-development-branch" [label="no"];
    "Findings open?" -> "Architectural issue?" [label="yes"];
    "Architectural issue?" -> "Phase 2: Plan/design depth by route" [label="yes"];
    "Architectural issue?" -> "Iteration cap hit?" [label="no"];
    "Iteration cap hit?" -> "Fix + re-review" [label="no"];
    "Fix + re-review" -> "Phase 4: Review + verification";
    "Iteration cap hit?" -> "End-of-loop handling" [label="yes"];
}
```

---

## Phase 0c: Setup (write routes only)

For routes `bug-incident` and `standard-build`, start in an isolated worktree.

**REQUIRED SUB-SKILL:** superpowers:using-git-worktrees (or preflight fallback).

For route `tiny-tweak`, default to a worktree, but you may skip worktree only if **all** are true:
1. User asked for a quick in-place fix or explicitly does not want branch artifacts.
2. Change is ultra-local (typically <= 5 LOC) in one file.
3. No behavior/API/schema/security impact.
4. Current branch is not `main`/`master`.

For route `advisory`, skip worktree by default unless the user explicitly asks for branch artifacts.

---

## Phase 1: Requirement gathering

**Goal:** establish the right outcome and constraints before implementation.

Route-specific depth:

| Route | Requirement outcome |
|---|---|
| tiny-tweak | 1-2 sentence confirmation of exact change and file scope |
| bug-incident | symptom + expected vs actual + reproduction context |
| advisory | explicit deliverable format and scope boundaries |
| standard-build | full scope, acceptance criteria, constraints, edge cases |

Use the `ask_user` tool one question at a time. Prefer multiple-choice when possible.

Mode rule:
- Collaborative — ask all needed questions.
- Autonomous — ask only blocking questions; record other assumptions in plan artifacts.

---

## Phase 1b: Diagnose root cause (bug-incident only)

**REQUIRED SUB-SKILL:** diagnose (preferred) or superpowers:systematic-debugging.

Do not design a fix before evidence of root cause. Minimum loop:
1. Reproduce reliably.
2. Minimize and isolate.
3. Form hypothesis.
4. Instrument/verify.
5. Confirm root cause with evidence.

If reproduction fails:
- Collaborative: ask for one targeted missing input.
- Autonomous: do not implement a fix without evidence. Produce an investigation deliverable (repro gaps, top hypotheses, next probes), then ask for direction before any code-changing route.

Gate to Phase 2 fix planning:
- Enter fix planning only after root-cause evidence exists.
- Without evidence, continue only in investigation/advisory mode.

---

## Phase 2: Design research and planning

Route-specific planning depth:

| Route | Planning depth | Required sub-skills |
|---|---|---|
| tiny-tweak | Micro-plan (3-6 bullets) focused on exact edits + checks | writing-plans optional |
| bug-incident | Targeted fix plan from diagnosed root cause | writing-plans required for non-trivial fixes |
| advisory | Full analysis plan and recommendations, no implementation | brainstorming -> grill-with-docs -> writing-plans |
| standard-build | Full design + implementation plan | brainstorming -> grill-with-docs -> writing-plans |

For `standard-build` and high-impact `bug-incident`, run two independent planning lenses in parallel:
1. **Domain challenger** (`model: claude-opus-4.7-xhigh`): run grill-with-docs against `CONTEXT.md` and `docs/adr/` (or preflight fallback sources) to pressure-test terminology, constraints, and tradeoffs.
   - Collaborative: keep user-interactive grilling even if autopilot is enabled.
   - Autonomous: ask only blocking questions; log assumptions.
2. **Delivery planner** (`model: gpt-5.5-xhigh-1.1m`): produce execution slices, dependencies, risks, and sequencing.

Reconcile both outputs into one coherent plan.

If the two lenses disagree, resolve explicitly using this rubric:

| Conflict type | Collaborative action | Autonomous action |
|---|---|---|
| Terminology/domain mismatch | Surface both options and ask user to pick preferred language/domain framing | Prefer domain challenger output; record rationale |
| Sequencing disagreement (same scope) | Present both sequences with tradeoffs and ask user to choose | Prefer lower-risk/higher-observability sequence |
| Scope disagreement (one broad, one narrow) | Ask user to confirm scope boundary | Prefer narrower scope first, record deferred items |
| Risk disagreement (safety/compliance/data) | Ask user immediately; do not proceed until resolved | Escalate via critical-risk override; do not guess |
| Other/hybrid conflict (feasibility, completeness, effort, mixed categories) | Surface both positions with recommendation and ask user | Prefer domain challenger for semantics/constraints and delivery planner for execution details; record rationale |

Always document which lens won each conflict and why.
When one disagreement matches multiple rows, apply the highest-risk row first, then resolve remaining rows.

**Plan approval gate (write routes):**
- Collaborative — after plan reviewer approval, present plan and wait for explicit user approval before Phase 3.
- Autonomous — proceed after plan reviewer approval; surface unresolved assumptions in artifacts.

**Advisory terminal state:** for route `advisory`, stop after Phase 2 deliverables unless the user explicitly asks to proceed to implementation.

---

## Phase 3: Implementation (write routes only)

**REQUIRED SUB-SKILL:** superpowers:subagent-driven-development (or preflight fallback).

That skill owns per-task implementer dispatch, spec-compliance review, code-quality review, and task tracking. Do not dispatch implementer sub-agents directly unless running documented fallback mode.

`tiny-tweak` direct-edit carve-out: you may implement directly without subagent-driven-development only when the ultra-local criteria from Phase 0c are met. Still run Phase 4 review/verification gates.

Re-entry from review loop:
- Normal fix loop: address findings while preserving working changes.
- Re-plan: if approach is invalid, return to Phase 2 for updated plan.

---

## Phase 4: Review and verification (write routes only)

In order, per task:

1. **Code review:** use project `code-review` skill (or fallback reviewer).
2. **Verification path:**
   - UI-visible changes: run Playwright visual verification with artifact capture at `.playwright-artifacts/<task-slug>/`.
   - Non-UI changes: run targeted build/lint/type/test checks appropriate to changed behavior.
   - Pure copy/text tiny tweak with no behavior change: lightweight sanity verification is sufficient.
3. Ensure `.playwright-artifacts/` is gitignored if artifacts were created.

Skip Playwright for non-visual changes, but state why.

---

## Loop policy: Phase 3 to Phase 4

Iteration budgets:
- `tiny-tweak`: max 1 review/fix loop before escalation.
- `bug-incident` and `standard-build`: max 3 loops per task.

Triggers for re-plan (return to Phase 2):
- Chosen approach is fundamentally wrong.
- Required behavior cannot fit current plan structure.
- New constraint invalidates core assumptions.
- Same class of issue repeats across loops.

After re-plan approval, resume Phase 3 and reset loop counter for changed-scope tasks.

---

## End-of-loop handling (open findings at cap)

**Collaborative:** stop, summarize completed/open items and attempts, present options (accept as-is / re-plan / manual takeover), wait for user direction.

**Autonomous:** stop iterating that task, decide per finding with the rubric in `end-of-loop.md`, continue other tasks, and report all decisions.

See `end-of-loop.md` for the autonomous decision rubric and final-report template.

---

## Red flags — STOP

- Skipping routing and forcing every request through full heavyweight flow.
- Classifying as `tiny-tweak` when any risk gate fails.
- Designing a bug fix before root cause is evidenced.
- Continuing silently when required skills/docs/models are missing.
- Running `grill-with-docs` against absent context without stating fallback assumptions.
- Entering Phase 3 on `advisory` route without explicit user request.
- Skipping collaborative user approval for write routes.
- Ignoring critical-risk override in autonomous mode.
- Looping past the route iteration cap.
- Dispatching implementers directly when subagent-driven-development is available and no tiny-tweak direct-edit carve-out applies.
- Running Playwright as a test runner instead of visual verification.

---

## Integration

**Required/primary sub-skills:**
- superpowers:using-git-worktrees — write-route setup
- diagnose (preferred) or superpowers:systematic-debugging — bug diagnosis
- superpowers:brainstorming — design drafting (full planning routes)
- grill-with-docs — domain-language and architecture stress test (full planning routes)
- superpowers:writing-plans — implementation planning
- superpowers:subagent-driven-development — implementation orchestration
- project code-review skill — code review
- superpowers:finishing-a-development-branch — post-success integration

**Recommended helper skill:**
- superpowers:dispatching-parallel-agents — independent planning lens dispatch

**Do not:**
- Re-implement delegated skill responsibilities inline unless fallback is required.
- Pass this orchestrator skill to sub-agents; give each agent only the focused skill it needs.
