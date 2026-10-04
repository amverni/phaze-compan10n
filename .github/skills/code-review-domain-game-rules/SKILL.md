---
name: code-review-domain-game-rules
description: Use when reviewing scoring, rounds, phases, skips, wilds, winners, tiebreakers, player state, or game completion behavior
---

# Domain / Game Rules Code Review Expert

Review only Phase 10 scoreboard domain behavior. Protect internal consistency without treating intentional custom rules as bugs.

## Review Focus

- Scoring, rounds, phase completion, skips, wilds, active/removed players, winner selection, tiebreakers, and game completion.
- The app may intentionally diverge from standard Phase 10 rules to add fun custom behavior.
- Do **not** flag intentional custom rules, including custom tiebreakers, as bugs solely because they differ from the physical card game.
- Use **Bug** only for contradictions with app requirements, code contracts, persisted state invariants, or internal consistency, such as impossible winners, lost scores, invalid phase progression, or completed games without required completion data.
- Use **Warning/Question** for ambiguous rule intent, surprising edge cases, or standard-rule divergences that are not clearly documented as intentional.
- Use **No finding** when the PR/spec clearly identifies the behavior as intentional and the implementation is internally consistent.

## Output

Return `No findings in scope.` or findings classified as `Bug`, `Warning`, or `Question`, with file/line, evidence, domain scenario, and suggested clarification/fix.
