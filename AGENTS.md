# Agent Instructions

## Agent skills

### Issue tracker

Issues, specs, tickets, triage work, and wayfinder maps are tracked in GitHub Issues for `amverni/phaze-compan10n`. See `docs/agents/issue-tracker.md`.

Completed-task commits must include `Closes #<number>` in the commit body, one line per completed issue. Use `Refs #<number>` for partial work. Confirm closure after the commit reaches GitHub's default branch through an authorized push or merge.

### Triage labels

Matt Pocock skills use the default triage label vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repo: read `CONTEXT.md` and relevant ADRs under `docs/adr/` before domain-sensitive work. See `docs/agents/domain.md`.

### Code review standards

Matt Pocock's `code-review` skill is the canonical `/code-review` workflow. Its Standards axis must include `docs/agents/code-review-standards.md`, `.github/copilot-instructions.md`, root `CONTEXT.md`, and relevant ADRs as standards sources.
