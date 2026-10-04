---
name: code-review-react
description: Use when reviewing React components, hooks, render behavior, state ownership, effects, lists, or component performance in the Phase 10 scoreboard app
---

# React Code Review Expert

Review only React concerns. Report concrete render bugs, state ownership issues, effect bugs, React Compiler convention violations, and component behavior regressions.

## Review Focus

- React Compiler is enabled: do not recommend routine `useMemo`/`useCallback`; flag manual memoization only when it creates bugs or fights project conventions.
- Check ownership of state and derived values. Avoid duplicated state that can drift from props, query data, form state, or persisted data.
- Review effects skeptically: effects should synchronize with external systems, not compute render data that belongs in render/API/query layers.
- Verify list keys are stable domain identifiers, not array indexes when order can change.
- Watch controlled/uncontrolled component state, stale closures, effect dependencies, conditional rendering, and render-time side effects.

## Output

Return `No findings in scope.` or findings with severity, file/line, evidence, why it matters, and a concrete fix. Do not comment on TypeScript, data architecture, styling, accessibility, or product flow unless it directly causes a React bug.
