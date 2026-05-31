# Glass Components Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every shared `.glass` surface more transparent and heavily frosted while preserving readability.

**Architecture:** The app already centralizes frosted surface styling in `src/index.css` through `.glass` and `.glass::after` custom properties. This plan changes only that shared CSS contract, then validates representative consumers rather than adding per-component variants or markup changes.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind CSS v4, Biome, Playwright for visual screenshot capture.

---

## File Structure

- Modify: `src/index.css`
  - Responsibility: Own the global `.glass` and `.glass::after` visual contract, including dark/light overrides and existing variant overrides.
- No component files should change unless visual validation proves a concrete regression that cannot be fixed through the shared glass variables.
- No data, route, hook, API, or IndexedDB files should change.

## Chunk 1: Global glass treatment

### Task 1: Tune shared glass CSS variables

**Files:**
- Modify: `src/index.css:63-132`

- [ ] **Step 1: Inspect current glass contract**

Run:

```bash
sed -n '57,133p' src/index.css
```

Expected: shows `.glass`, `.glass::after`, dark-mode overrides, and light-mode refinements with custom properties named `--_g-*` and `--_gs-*`.

- [ ] **Step 2: Update the base `.glass` treatment**

In `src/index.css`, replace the existing base `.glass` block with this heavy frosted treatment. Do not append a second `.glass` block.

```css
.glass {
  --_g-bg: rgba(255, 255, 255, 0.12);
  --_g-filter: blur(28px) saturate(170%) brightness(118%);
  --_g-border: rgba(255, 255, 255, 0.30);
  --_g-shadow: 0 8px 32px rgba(0, 0, 0, 0.20),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);

  background: var(--_g-bg);
  backdrop-filter: var(--_g-filter);
  -webkit-backdrop-filter: var(--_g-filter);
  border: 1px solid var(--_g-border);
  box-shadow: var(--_g-shadow);
}
```

Expected: base fill opacity is lower than the current `0.20`, blur is substantially higher than `4px`, and border/shadow remain strong enough to define the surface.

- [ ] **Step 3: Update the base `.glass::after` overlay**

In `src/index.css`, replace the existing base `.glass::after` block so the shine overlay stays subtle. Do not duplicate the pseudo-element block.

```css
.glass::after {
  --_gs-bg: rgba(255, 255, 255, 0.06);
  --_gs-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.22),
    inset 0 -1px 0 0 rgba(0, 0, 0, 0.03);
  --_gs-opacity: 0.35;
  --_gs-filter: blur(0.5px) brightness(106%);

  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  backdrop-filter: blur(1px);
  -webkit-backdrop-filter: blur(1px);
  background: var(--_gs-bg);
  box-shadow: var(--_gs-shadow);
  opacity: var(--_gs-opacity);
  z-index: -1;
  pointer-events: none;
  filter: var(--_gs-filter);
}
```

Expected: overlay opacity/background are reduced from the current treatment so the lower main fill is not re-opaqued by the pseudo-element.

- [ ] **Step 4: Update dark-mode glass overrides**

In `src/index.css`, replace the existing dark-mode `.glass` and `.glass::after` overrides:

```css
@media (prefers-color-scheme: dark) {
  .glass {
    --_g-bg: rgba(255, 255, 255, 0.035);
    --_g-filter: blur(28px) saturate(190%) brightness(55%);
    --_g-border: rgba(255, 255, 255, 0.20);
    --_g-shadow: 0 8px 36px rgba(0, 0, 0, 0.48),
      inset 0 1px 0 rgba(255, 255, 255, 0.10);
  }

  .glass::after {
    --_gs-bg: rgba(255, 255, 255, 0.04);
    --_gs-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.10),
      inset 0 -1px 0 0 rgba(0, 0, 0, 0.16);
    --_gs-opacity: 0.16;
    --_gs-filter: blur(0.5px) brightness(92%);
  }
}
```

Expected: dark mode remains lower-opacity than light/base glass, keeps the heavy blur, and preserves enough border/shadow definition.

- [ ] **Step 5: Update light-mode glass refinements**

In `src/index.css`, replace the existing light-mode refinements so they keep border/shadow contrast and reduce the light-mode overlay:

```css
@media (prefers-color-scheme: light) {
  .glass {
    --_g-border: rgba(0, 0, 0, 0.16);
    --_g-shadow: 0 8px 32px rgba(0, 0, 0, 0.22),
      inset 0 1px 0 rgba(255, 255, 255, 0.18);
  }

  .glass::after {
    --_gs-bg: rgba(255, 255, 255, 0.18);
    --_gs-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.45),
      inset 0 -1px 0 0 rgba(0, 0, 0, 0.04);
    --_gs-opacity: 0.28;
    --_gs-filter: blur(0.5px) brightness(100%);
  }
}
```

Expected: light-mode glass is more transparent than before but does not disappear against white backgrounds.

- [ ] **Step 6: Confirm no component markup changed**

Run:

```bash
git --no-pager diff -- src/index.css
```

Expected: the only implementation diff is `src/index.css`, and changes are limited to the `.glass`/`.glass::after` custom properties and their color-scheme overrides.

- [ ] **Step 7: Run formatter/lint check**

Run:

```bash
npm run lint
```

Expected: exits 0. The existing Biome schema-version info message may appear; no errors or fixes should be required.

- [ ] **Step 8: Run production build**

Run:

```bash
npm run build
```

Expected: exits 0. Vite may warn that some chunks are larger than 500 kB; that warning is pre-existing and not caused by this CSS-only change.

- [ ] **Step 9: Start a local preview for visual checks**

Check whether a dev server is already listening:

```bash
lsof -nP -iTCP:5173 -sTCP:LISTEN 2>/dev/null || true
```

Expected: if no listener appears, start Vite. If a listener already exists, use that URL instead of starting a second server.

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Expected: Vite prints a local URL such as `http://127.0.0.1:5173/`. Keep this process running until visual checks are complete.

- [ ] **Step 10: Capture representative screenshots**

Check whether Playwright is available:

```bash
npx playwright --version
```

Expected: prints the installed Playwright version. If this fails because Playwright is unavailable, use the browser manually for the same visual checks and record that Playwright capture was unavailable.

Use Playwright or browser tooling against the local Vite URL to capture light and dark screenshots into `.playwright-artifacts/glass-ux/`. At minimum, inspect:

```text
/#/                  Home/app shell glass surfaces
/#/players           List/search/input glass surfaces
/#/create            Tab/listbox/form glass surfaces, if reachable without seeded data
```

If a seeded active game is already available in the browser profile, also inspect the active game scoreboard route for dense rows and sticky surfaces.

Expected: screenshots show heavier frosted blur and increased transparency without illegible text, lost button boundaries, or obvious sticky/header regressions.

- [ ] **Step 11: Fix only concrete visual regressions**

If screenshots reveal a regression, first adjust the shared `.glass` variables in `src/index.css`. Only edit a component file if the regression is specific to one component and cannot be solved through the shared variables without harming other representative screens.

Expected: any additional edits are justified by screenshot evidence and remain narrowly scoped.

- [ ] **Step 12: Re-run checks after final visual tuning**

Run:

```bash
npm run lint && npm run build
```

Expected: both commands exit 0, with only known non-blocking build/lint informational output.

- [ ] **Step 13: Commit implementation**

Run:

```bash
git add src/index.css
git commit -m "Refine glass surface treatment" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

Expected: commit includes `src/index.css` only unless a screenshot-proven component-specific regression required another source edit. `.playwright-artifacts/` remains untracked because it is gitignored.
