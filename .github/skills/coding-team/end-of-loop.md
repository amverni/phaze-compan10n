# Coding Team — End-of-Loop Handling Reference

Loaded by the `coding-team` skill when a task hits the 3-iteration cap with open findings, and used at the end of every run for the final report.

---

## Autonomous mode: per-finding decision rubric

For each open finding, pick **one** action and commit it:

1. **Accept as-is** — acknowledge the finding but make no further change (low severity, intentional trade-off, out of scope). No new commit.
2. **Apply partial / workaround fix** — best attempt at addressing the finding without another full review loop. Commit the change.
3. **Defer with TODO** — leave a `TODO(coding-team):` comment at the relevant file:line referencing the finding, and commit.

**Tie-breaker:** prefer the less invasive option when two choices look equally reasonable: `accept > defer > workaround`.

Once every finding for the current task has a decision, continue to the next task.

---

## Collaborative mode: handoff to user

1. Stop the loop.
2. Summarize what is done, what is still open, and what was tried in each of the 3 iterations.
3. Present open findings to the user with concrete options:
   - Accept and merge as-is (note as known issues).
   - Re-plan and try a different approach.
   - Take over manually from here.
4. Wait for user direction. Do not retry on your own.

---

## Final report template

At the end of every run (success or end-of-loop), produce a summary including:

- **Mode used** (collaborative / autonomous)
- **Worktree path** and branch
- **Spec and plan paths** (committed)
- **Tasks completed** with status (✅ clean / ⚠️ completed with open findings / ⏭ skipped)
- **Open findings** per task — file:line, severity, reviewer comment, and in autonomous mode the decision made (accept / partial fix / defer) plus a one-sentence rationale
- **Playwright artifacts** directory
- **Recommended next step** (e.g., superpowers:finishing-a-development-branch)
