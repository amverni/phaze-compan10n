---
name: coding-team
description: Use when the user prompt explicitly invokes coding-team to orchestrate a multi-phase feature, change, or bugfix end-to-end, with optional collaborative or autonomous mode keyword
---

# Coding Team

You are the lead of a team of sub-agents. The user describes what they want; you orchestrate requirement gathering, planning, implementation, and review. Sub-agents do the focused work; you sequence the phases, hold the gates, and surface what the user needs to see.

**Core principle:** delegate to existing skills, hold the gates, never silently skip a phase.

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
| Phase 1 clarifying questions | Ask every question needed | Ask only blocking questions; record other assumptions in the plan |
| Phase 2 plan approval | Wait for explicit user approval | Proceed after plan reviewer approves |
| End of Phase 4 loop with open findings | Surface to user, wait for direction | Decide per finding (accept / partial fix / defer), continue |

**Announce at start:** "I am using the coding-team skill in <mode> mode."

---

## Phase summary

| Phase | What happens | Delegated skill |
|---|---|---|
| 0. Setup | Create an isolated worktree | superpowers:using-git-worktrees |
| 1. Requirements | Light research + clarifying questions | (this skill) |
| 2. Plan | Brainstorm, design spec, implementation plan, plan review | superpowers:brainstorming then superpowers:writing-plans |
| 3. Implement | Subagent-per-task, TDD, commits | superpowers:subagent-driven-development |
| 4. Review | Code review + Playwright visual verification | project code-review skill |
| Loop | Phase 3 to Phase 4, max 3 iterations per task | — |

---

## Process flow

```dot
digraph coding_team {
    rankdir=TB;
    "Parse mode from prompt" [shape=box];
    "Setup worktree" [shape=box];
    "Phase 1: Requirements" [shape=box];
    "Phase 2: Brainstorm + plan + plan review" [shape=box];
    "Plan approved by reviewer?" [shape=diamond];
    "Collaborative mode?" [shape=diamond];
    "Wait for user approval" [shape=box];
    "Phase 3: Implement (subagent-driven)" [shape=box];
    "Phase 4: Review + verification" [shape=box];
    "Findings open?" [shape=diamond];
    "Architectural issue?" [shape=diamond];
    "Iteration < 3?" [shape=diamond];
    "Fix + re-review" [shape=box];
    "End-of-loop handling" [shape=box];
    "Re-plan (back to Phase 2, reset counter)" [shape=box];
    "Done: finishing-a-development-branch" [shape=doublecircle];

    "Parse mode from prompt" -> "Setup worktree";
    "Setup worktree" -> "Phase 1: Requirements";
    "Phase 1: Requirements" -> "Phase 2: Brainstorm + plan + plan review";
    "Phase 2: Brainstorm + plan + plan review" -> "Plan approved by reviewer?";
    "Plan approved by reviewer?" -> "Phase 2: Brainstorm + plan + plan review" [label="no, fix"];
    "Plan approved by reviewer?" -> "Collaborative mode?" [label="yes"];
    "Collaborative mode?" -> "Wait for user approval" [label="yes"];
    "Wait for user approval" -> "Phase 3: Implement (subagent-driven)";
    "Collaborative mode?" -> "Phase 3: Implement (subagent-driven)" [label="no"];
    "Phase 3: Implement (subagent-driven)" -> "Phase 4: Review + verification";
    "Phase 4: Review + verification" -> "Findings open?";
    "Findings open?" -> "Done: finishing-a-development-branch" [label="no"];
    "Findings open?" -> "Architectural issue?" [label="yes"];
    "Architectural issue?" -> "Re-plan (back to Phase 2, reset counter)" [label="yes"];
    "Re-plan (back to Phase 2, reset counter)" -> "Phase 2: Brainstorm + plan + plan review";
    "Architectural issue?" -> "Iteration < 3?" [label="no"];
    "Iteration < 3?" -> "Fix + re-review" [label="yes"];
    "Fix + re-review" -> "Phase 4: Review + verification";
    "Iteration < 3?" -> "End-of-loop handling" [label="no"];
}
```

---

## Phase 0: Setup

Start in an isolated worktree. **REQUIRED SUB-SKILL:** superpowers:using-git-worktrees. Do this **before** Phase 1 so the requirement-gathering session and all artifacts live on the worktree branch.

---

## Phase 1: Requirement Gathering

**Goal:** be confident you understand *what* to build before designing *how* to build it.

1. Light context exploration only — read the prompt, check recent commits, glance at directly-relevant files. Do not design architecture or research libraries yet; that is Phase 2.
2. Ask clarifying questions to converge on: the actual desired outcome, scope boundaries, acceptance criteria, and constraints (existing patterns, tech to use or avoid, edge cases).
3. Use the `ask_user` tool, one question at a time, multiple-choice when possible.
4. Stop when you can summarize the requirement in 2–3 sentences without major gaps.

**Mode rule:**
- Collaborative — ask every question needed.
- Autonomous — ask only where guessing wrong would derail the work; record everything else as an assumption in the plan.

---

## Phase 2: Research & Planning

**REQUIRED SUB-SKILLS:** superpowers:brainstorming then superpowers:writing-plans.

1. Brainstorm + design (brainstorming): produce the design spec at `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` and commit.
2. Implementation plan (writing-plans): bite-sized tasks at `docs/superpowers/plans/YYYY-MM-DD-<feature>.md`. The plan review loop is owned by that skill (max 5 iterations per its policy).
3. **Plan approval gate:**
   - Collaborative — after the plan reviewer approves, present the plan to the user and wait for explicit approval before Phase 3. Iterate as needed.
   - Autonomous — proceed to Phase 3 once the plan reviewer approves. Surface unresolved questions as assumptions in the plan, not as user prompts.

---

## Phase 3: Implementation

**REQUIRED SUB-SKILL:** superpowers:subagent-driven-development.

That skill owns per-task implementer dispatch, spec-compliance review, code-quality review, and TodoWrite tracking. Do not dispatch implementer sub-agents directly.

**Re-entry from the review loop:**
- Normal fix loop — tell the sub-skill which findings to address; existing work is kept and fixes are applied.
- Re-plan — the plan changed; re-implement only the tasks whose scope changed, from scratch.

---

## Phase 4: Review & Verification

In this order, per task:

**4a. Code review.** Use the project's `code-review` skill at `.github/skills/code-review/`. It already orchestrates expert reviewers — do not duplicate that here.

**4b. Playwright visual verification.** Only when the task produced a visible change.

1. Build and start the app (`npm run dev` or `npm run preview`).
2. Dispatch a sub-agent with Playwright access to: navigate the affected screens, capture screenshots (and recordings for interaction flows), save artifacts to `.playwright-artifacts/<task-slug>/` (gitignored), compare to expected behavior from the plan, and return PASS / FAIL with evidence.
3. If `.playwright-artifacts/` is not in `.gitignore`, add it.

Skip Playwright for non-visual tasks (pure data layer, types, internal refactor with no UI surface). The sub-agent must justify the skip.

---

## Loop policy: Phase 3 to Phase 4

**Per-task budget: max 3 iterations.** Each iteration = one full pass of fix → code review → verification.

**Architectural / plan-level (triggers re-plan):**
- The reviewer flags that the chosen approach is fundamentally wrong.
- Required behavior cannot be implemented within the plan's structure.
- A constraint the plan did not account for has emerged.
- The same class of issue keeps reappearing across iterations.

When you re-plan: return to Phase 2, update the plan, get plan-reviewer approval, then re-enter Phase 3. **Reset the per-task counter to 0** for any task whose scope changed.

---

## End-of-loop handling (3 iterations hit with open findings)

**Collaborative:** stop, summarize what was done and what is open, present concrete options (accept-as-is / re-plan / take over manually), wait for user direction.

**Autonomous:** stop iterating but do not stop the run. For each open finding, decide and act per the rubric in `end-of-loop.md`. Continue to the next task and surface every decision in the final report.

See `end-of-loop.md` for the detailed autonomous decision rubric and the final-report template.

---

## Red flags — STOP

- Skipping Phase 1 because "the request is obvious." Do it anyway.
- Skipping the plan approval gate in collaborative mode because the plan reviewer approved. The user gate is separate.
- Inferring autonomous mode from anything other than the explicit keyword (autopilot, session settings, prior history).
- Looping past 3 iterations on a task. The cap exists to force escalation.
- Surfacing mid-flight questions to the user in autonomous mode. Record assumptions, continue, summarize at the end.
- Running Playwright in tests-mode. Use it as a visual verification tool, not a test runner.
- Dispatching implementer sub-agents directly when subagent-driven-development should handle that.
- Working on main or master. Always set up a worktree first.

---

## Integration

**Required sub-skills (delegate to these):**
- superpowers:using-git-worktrees — Phase 0
- superpowers:brainstorming — Phase 2 design
- superpowers:writing-plans — Phase 2 plan
- superpowers:subagent-driven-development — Phase 3 and per-task spec/quality review
- project code-review skill — Phase 4 code review
- superpowers:finishing-a-development-branch — after the final clean report

**Do not:**
- Re-implement the responsibilities of the delegated skills inline.
- Pass this orchestrator skill to sub-agents — give them only the focused skill they need.
