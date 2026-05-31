# Glass Consistency Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make shared glass surfaces simpler, more consistent, less milky, and more blur-driven while preserving readability.

**Architecture:** Keep the current CSS custom-property boundary: `.glass` owns base glass, `.listbox-glass` and `.popover-glass` own scrim-less floating glass, and `.dialog-glass` owns modal glass. Tune shared roles only; do not add Settings-specific, Add Round-specific, or route-specific glass overrides.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Headless UI, Biome, Playwright.

---

## File Structure

- Modify: `src/index.css`
  - Responsibility: Define the base `.glass` material, pseudo-element shine, light/dark refinements, and the existing light-mode interactive control override.
- Modify: `src/components/ui/Listbox/Listbox.css`
  - Responsibility: Define the shared floating glass role for listbox option panels and keep listbox animation behavior unchanged.
- Modify: `src/components/ui/Popover/Popover.css`
  - Responsibility: Define the shared floating glass role for popover panels using the same visual tokens as listbox option panels.
- Modify: `src/components/ui/Dialog/Dialog.css`
  - Responsibility: Define the shared modal glass role and structural edge tuning for nested glass inside dialogs.
- Do not modify: `src/components/Settings/*`, `src/components/Scoreboard/AddRoundDialog.tsx`, route files, data files, hooks, IndexedDB code, or `src/routeTree.gen.ts`.

## Chunk 1: Shared role tokens and validation

### Task 1: Establish a browser style-contract probe

**Files:**
- Read: `src/index.css`
- Read: `src/components/ui/Listbox/Listbox.css`
- Read: `src/components/ui/Popover/Popover.css`
- Read: `src/components/ui/Dialog/Dialog.css`

- [ ] **Step 1: Confirm the working tree before editing**

Run:

```bash
git --no-pager status --short
```

Expected: existing unrelated dirty files may be present. Do not revert or stage unrelated files. This plan should only touch the four CSS files listed above.

- [ ] **Step 2: Start Vite for browser-backed CSS inspection**

Run:

```bash
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Expected: Vite prints `http://127.0.0.1:5173/`. Keep the process running for the remaining browser checks.

- [ ] **Step 3: Run the style-contract probe and verify it fails before implementation**

In a second terminal, run:

```bash
node --input-type=module <<'NODE'
import { chromium } from "playwright";

const url = "http://127.0.0.1:5173/";

const expectedLight = {
  base: { bg: "rgba(255, 255, 255, 0.1)", blur: "blur(40px)" },
  button: { bg: "rgba(255, 255, 255, 0.3)", blur: "blur(40px)" },
  listbox: { bg: "rgba(255, 255, 255, 0.51)", blur: "blur(48px)" },
  popover: { bg: "rgba(255, 255, 255, 0.51)", blur: "blur(48px)" },
  dialog: { bg: "rgba(255, 255, 255, 0.24)", blur: "blur(48px)" },
};

const expectedDark = {
  base: { bg: "rgba(255, 255, 255, 0.03)", blur: "blur(40px)" },
  listbox: { bg: "rgba(18, 18, 18, 0.32)", blur: "blur(48px)" },
  popover: { bg: "rgba(18, 18, 18, 0.32)", blur: "blur(48px)" },
  dialog: { bg: "rgba(18, 18, 18, 0.3)", blur: "blur(48px)" },
};

async function collect(page, colorScheme) {
  await page.emulateMedia({ colorScheme });
  await page.goto(url, { waitUntil: "networkidle" });
  return page.evaluate(() => {
    document.body.innerHTML = `
      <main style="padding:24px;background:linear-gradient(135deg,#ef4444,#facc15,#22c55e,#3b82f6);">
        <section data-key="base" class="glass" style="position:relative;width:180px;height:60px;border-radius:16px;"></section>
        <button data-key="button" class="glass" style="position:relative;width:180px;height:60px;border-radius:999px;">Button</button>
        <section data-key="listbox" class="glass listbox-glass" style="position:relative;width:180px;height:60px;border-radius:16px;"></section>
        <section data-key="popover" class="glass popover-glass" style="position:relative;width:180px;height:60px;border-radius:16px;"></section>
        <section data-key="dialog" class="glass dialog-glass" style="position:relative;width:180px;height:60px;border-radius:16px;"></section>
      </main>
    `;

    return Object.fromEntries(
      [...document.querySelectorAll("[data-key]")].map((el) => {
        const style = getComputedStyle(el);
        return [
          el.getAttribute("data-key"),
          {
            bg: style.backgroundColor,
            filter: style.backdropFilter || style.webkitBackdropFilter,
          },
        ];
      }),
    );
  });
}

function assertRole(actual, expected, label) {
  for (const [role, expectation] of Object.entries(expected)) {
    if (actual[role].bg !== expectation.bg) {
      throw new Error(`${label} ${role} background expected ${expectation.bg}, got ${actual[role].bg}`);
    }
    if (!actual[role].filter.includes(expectation.blur)) {
      throw new Error(`${label} ${role} filter expected ${expectation.blur}, got ${actual[role].filter}`);
    }
  }
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const light = await collect(page, "light");
const dark = await collect(page, "dark");
await browser.close();

assertRole(light, expectedLight, "light");
assertRole(dark, expectedDark, "dark");
console.log(JSON.stringify({ light, dark }, null, 2));
NODE
```

Expected before implementation: exits non-zero because current token values do not match the approved role contract. Keep this command for the post-implementation verification step.

### Task 2: Tune the base glass role

**Files:**
- Modify: `src/index.css:63-154`

- [ ] **Step 1: Replace the base `.glass` token block**

In `src/index.css`, update the `.glass` block to:

```css
.glass {
  --_g-bg: rgba(255, 255, 255, 0.10);
  --_g-filter: blur(40px) saturate(170%) brightness(112%);
  --_g-border: rgba(255, 255, 255, 0.28);
  --_g-shadow: 0 6px 18px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.16);

  background: var(--_g-bg);
  backdrop-filter: var(--_g-filter);
  -webkit-backdrop-filter: var(--_g-filter);
  border: 1px solid var(--_g-border);
  box-shadow: var(--_g-shadow);
}
```

Expected: base glass becomes slightly less filled than the current `0.12` and moves from 28px blur to 40px blur.

- [ ] **Step 2: Replace the base `.glass::after` shine block**

In `src/index.css`, update `.glass::after` to:

```css
.glass::after {
  --_gs-bg: rgba(255, 255, 255, 0.04);
  --_gs-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.18),
    inset 0 -1px 0 0 rgba(0, 0, 0, 0.03);
  --_gs-opacity: 0.28;
  --_gs-filter: blur(0.5px) brightness(102%);

  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--_gs-bg);
  box-shadow: var(--_gs-shadow);
  opacity: var(--_gs-opacity);
  z-index: -1;
  pointer-events: none;
  filter: var(--_gs-filter);
}
```

Expected: the shine overlay no longer re-opaques the lower base fill.

- [ ] **Step 3: Replace dark-mode base glass refinements**

In the existing `@media (prefers-color-scheme: dark)` block in `src/index.css`, update the `.glass` and `.glass::after` overrides to:

```css
@media (prefers-color-scheme: dark) {
  .glass {
    --_g-bg: rgba(255, 255, 255, 0.03);
    --_g-filter: blur(40px) saturate(180%) brightness(58%);
    --_g-border: rgba(255, 255, 255, 0.18);
    --_g-shadow: 0 8px 28px rgba(0, 0, 0, 0.48),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .glass::after {
    --_gs-bg: rgba(255, 255, 255, 0.03);
    --_gs-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.08),
      inset 0 -1px 0 0 rgba(0, 0, 0, 0.16);
    --_gs-opacity: 0.14;
    --_gs-filter: blur(0.5px) brightness(90%);
  }
}
```

Expected: dark base glass stays transparent and blur-forward while preserving edge contrast.

- [ ] **Step 4: Replace light-mode base glass refinements**

In the existing `@media (prefers-color-scheme: light)` block in `src/index.css`, update the base `.glass` and `.glass::after` overrides to:

```css
@media (prefers-color-scheme: light) {
  .glass {
    --_g-border: rgba(0, 0, 0, 0.14);
    --_g-shadow: 0 4px 14px rgba(0, 0, 0, 0.18),
      inset 0 1px 0 rgba(255, 255, 255, 0.16);
  }

  .glass::after {
    --_gs-bg: rgba(255, 255, 255, 0.10);
    --_gs-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.30),
      inset 0 -1px 0 0 rgba(0, 0, 0, 0.04);
    --_gs-opacity: 0.20;
    --_gs-filter: blur(0.5px) brightness(100%);
  }
```

Leave the existing light-mode interactive selector inside this same media block.

Expected: light-mode base glass keeps visible edge definition on white backgrounds without reading as a gray box.

- [ ] **Step 5: Replace the light-mode interactive control override**

Still in `src/index.css`, update the existing selector that starts with `button.glass:not(.glass-danger):not(.glass-error),` to use:

```css
  button.glass:not(.glass-danger):not(.glass-error),
  a.glass:not(.glass-danger):not(.glass-error),
  button > .glass:not(.glass-danger):not(.glass-error):not(.glass-tab-indicator),
  a > .glass:not(.glass-danger):not(.glass-error):not(.glass-tab-indicator),
  [role="button"].glass:not(.glass-danger):not(.glass-error),
  [role="checkbox"].glass:not(.glass-danger):not(.glass-error),
  [role="combobox"].glass:not(.glass-danger):not(.glass-error),
  [role="menuitem"].glass:not(.glass-danger):not(.glass-error),
  [role="option"].glass:not(.glass-danger):not(.glass-error),
  [role="radio"].glass:not(.glass-danger):not(.glass-error),
  [role="switch"].glass:not(.glass-danger):not(.glass-error),
  [role="tab"].glass:not(.glass-danger):not(.glass-error) {
    --_g-bg: rgba(255, 255, 255, 0.30);
    --_g-filter: blur(40px) saturate(170%) brightness(112%);
    --_g-border: rgba(0, 0, 0, 0.16);
    --_g-shadow: 0 2px 10px rgba(0, 0, 0, 0.14),
      inset 0 1px 0 rgba(255, 255, 255, 0.22);
    --_gs-bg: rgba(255, 255, 255, 0.10);
    --_gs-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.30),
      inset 0 -1px 0 0 rgba(0, 0, 0, 0.03);
    --_gs-opacity: 0.22;
  }
}
```

Expected: buttons and other interactive glass controls no longer use the current near-opaque `0.75` light fill.

- [ ] **Step 6: Inspect the base-role diff**

Run:

```bash
git --no-pager diff -- src/index.css
```

Expected: changes are limited to base glass variables, pseudo-element variables, dark/light refinements, and the existing light-mode interactive override.

### Task 3: Tune floating and dialog roles

**Files:**
- Modify: `src/components/ui/Listbox/Listbox.css:1-87`
- Modify: `src/components/ui/Popover/Popover.css:21-41`
- Modify: `src/components/ui/Dialog/Dialog.css:48-75`

- [ ] **Step 1: Replace listbox floating role tokens**

In `src/components/ui/Listbox/Listbox.css`, update only `.listbox-glass` and its light/dark media overrides. Do not change `.listbox-options` animations or keyframes.

```css
.listbox-glass {
  --_g-bg: rgba(255, 255, 255, 0.51);
  --_g-filter: blur(48px) saturate(170%) brightness(110%);
  --_gs-bg: rgba(255, 255, 255, 0.06);
  --_gs-opacity: 0.18;
  --_gs-filter: blur(0.5px) brightness(100%);
}
```

```css
@media (prefers-color-scheme: dark) {
  .listbox-glass {
    --_g-bg: rgba(18, 18, 18, 0.32);
    --_g-filter: blur(48px) saturate(155%) brightness(58%);
    --_gs-bg: rgba(255, 255, 255, 0.03);
    --_gs-opacity: 0.12;
  }
}
```

```css
@media (prefers-color-scheme: light) {
  .listbox-glass {
    --_g-bg: rgba(255, 255, 255, 0.51);
    --_g-border: rgba(0, 0, 0, 0.10);
    --_g-shadow: 0 10px 30px rgba(0, 0, 0, 0.12),
      0 1px 3px rgba(0, 0, 0, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.28);
  }
}
```

Expected: listbox panels keep enough light fill for dark-backdrop text contrast while reducing the milky shine/inset treatment. The light fill drops only slightly because contrast over dark backdrops is the limiting case; most of the perceived de-milking comes from lowering the shine overlay and increasing blur.

- [ ] **Step 2: Replace popover floating role tokens**

In `src/components/ui/Popover/Popover.css`, update `.popover-glass` and its light/dark media overrides. Do not change popover transition classes.

```css
.popover-glass {
  --_g-bg: rgba(255, 255, 255, 0.51);
  --_g-filter: blur(48px) saturate(170%) brightness(110%);
  --_gs-bg: rgba(255, 255, 255, 0.06);
  --_gs-opacity: 0.18;
  --_gs-filter: blur(0.5px) brightness(100%);
}
```

```css
@media (prefers-color-scheme: dark) {
  .popover-glass {
    --_g-bg: rgba(18, 18, 18, 0.32);
    --_g-filter: blur(48px) saturate(155%) brightness(58%);
    --_gs-bg: rgba(255, 255, 255, 0.03);
    --_gs-opacity: 0.12;
  }
}
```

```css
@media (prefers-color-scheme: light) {
  .popover-glass {
    --_g-bg: rgba(255, 255, 255, 0.51);
    --_g-border: rgba(0, 0, 0, 0.10);
    --_g-shadow: 0 10px 30px rgba(0, 0, 0, 0.12),
      0 1px 3px rgba(0, 0, 0, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.28);
  }
}
```

Expected: listbox and popover are visually aligned because both are scrim-less floating panels.

- [ ] **Step 3: Replace dialog role tokens**

In `src/components/ui/Dialog/Dialog.css`, update `.dialog-glass` and its media overrides to:

```css
.dialog-glass {
  --_g-bg: rgba(255, 255, 255, 0.24);
  --_g-filter: blur(48px) saturate(170%) brightness(110%);
  --_gs-bg: rgba(255, 255, 255, 0.04);
  --_gs-opacity: 0.16;
  --_gs-filter: blur(0.5px) brightness(100%);
  border-bottom: none;
}
```

```css
@media (prefers-color-scheme: dark) {
  .dialog-glass {
    --_g-bg: rgba(18, 18, 18, 0.30);
    --_g-filter: blur(48px) saturate(155%) brightness(70%);
    --_gs-bg: rgba(255, 255, 255, 0.03);
    --_gs-opacity: 0.12;
  }
}
```

```css
@media (prefers-color-scheme: light) {
  .dialog-glass {
    --_g-bg: rgba(255, 255, 255, 0.24);
    --_g-border: rgba(0, 0, 0, 0.08);
    --_g-shadow: 0 8px 22px rgba(0, 0, 0, 0.14),
      0 1px 3px rgba(0, 0, 0, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.24);
  }

  .dialog-glass .glass {
    --_g-border: rgba(0, 0, 0, 0.14);
    --_g-shadow: 0 4px 10px rgba(0, 0, 0, 0.16),
      inset 0 1px 0 rgba(255, 255, 255, 0.16);
  }
}
```

Expected: dialogs are more transparent than floating panels, and nested dialog glass only receives structural edge tuning.

- [ ] **Step 4: Confirm no feature-screen glass override was added**

Run:

```bash
rg "listbox-glass|popover-glass|dialog-glass|--_g-bg|--_g-filter|--_gs-bg|--_gs-opacity" src/components/Settings src/components/Scoreboard src/routes || true
```

Expected: no output. Ripgrep exits 1 when there are no matches, so `|| true` keeps the expected no-output result from stopping the workflow. If any matches appear, inspect them and remove feature-screen glass tokens before proceeding.

- [ ] **Step 5: Inspect the role-token diff**

Run:

```bash
git --no-pager diff -- src/index.css src/components/ui/Listbox/Listbox.css src/components/ui/Popover/Popover.css src/components/ui/Dialog/Dialog.css
```

Expected: only shared role CSS files changed. There should be no component markup, data, hook, or route changes in this diff.

### Task 4: Verify style contract, real-app surfaces, and quality gates

**Files:**
- Verify: `src/index.css`
- Verify: `src/components/ui/Listbox/Listbox.css`
- Verify: `src/components/ui/Popover/Popover.css`
- Verify: `src/components/ui/Dialog/Dialog.css`

- [ ] **Step 1: Re-run the style-contract probe**

Run the exact `node --input-type=module` Playwright command from Task 1, Step 3.

Expected after implementation: exits 0 and prints computed light/dark styles. The output should include:

```text
"base"
"rgba(255, 255, 255, 0.1)"
"listbox"
"rgba(255, 255, 255, 0.51)"
"popover"
"rgba(255, 255, 255, 0.51)"
"dialog"
"rgba(255, 255, 255, 0.24)"
```

- [ ] **Step 2: Capture scriptable real-app screenshots**

Run:

```bash
mkdir -p .playwright-artifacts/glass-consistency
node --input-type=module <<'NODE'
import { chromium } from "playwright";

const baseURL = "http://127.0.0.1:5173/";
const seed = {
  gameId: "glass-ux-game",
  players: [
    { id: "glass-player-a", name: "Jam", color: "#df0e88" },
    { id: "glass-player-b", name: "Spartan", color: "#18453B" },
    { id: "glass-player-c", name: "Santorini", color: "#1D4ED8" },
  ],
};
const routes = [
  { name: "home", hash: "#/" },
  { name: "players", hash: "#/players" },
  { name: "create", hash: "#/create" },
  { name: "settings", hash: "#/settings" },
];

async function seedGame(page) {
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(async (seedData) => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open("phase10-db");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    const now = Date.now();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(["players", "games", "settings"], "readwrite");
      const playersStore = tx.objectStore("players");
      const gamesStore = tx.objectStore("games");
      const settingsStore = tx.objectStore("settings");

      for (const player of seedData.players) {
        playersStore.put({
          ...player,
          createdAt: now,
          wins: 0,
          isFavorite: 1,
        });
      }

      gamesStore.put({
        id: seedData.gameId,
        status: "active",
        phaseSet: {
          id: "glass-ux-phase-set",
          name: "Original",
          type: "temporary",
          phases: ["classic-1", "classic-2", "classic-3"],
        },
        players: seedData.players.map((player) => player.id),
        activePlayers: seedData.players.map((player) => player.id),
        settings: {
          tiebreaker: "lowestPoints",
          roundSkipPenalty: 100,
          sitOutPenalty: 50,
        },
        createdAt: now,
        lastActivityAt: now,
      });

      settingsStore.put({
        id: "app",
        gameDefaults: {
          tiebreaker: "lowestPoints",
          roundSkipPenalty: 100,
          sitOutPenalty: 50,
          phaseSetId: "original",
        },
      });

      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => resolve();
    });

    db.close();
  }, seed);
}

const browser = await chromium.launch({ headless: true });
for (const colorScheme of ["light", "dark"]) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.emulateMedia({ colorScheme });
  await seedGame(page);

  for (const route of routes) {
    await page.goto(`${baseURL}${route.hash}`, { waitUntil: "networkidle" });
    await page.screenshot({
      path: `.playwright-artifacts/glass-consistency/${route.name}-${colorScheme}.png`,
      fullPage: true,
    });
  }

  await page.goto(`${baseURL}#/settings`, { waitUntil: "networkidle" });
  const settingsListboxes = [
    { name: "settings-tiebreaker-listbox", text: "Lowest Points" },
    { name: "settings-skip-penalty-listbox", text: "100 pts" },
    { name: "settings-phase-set-listbox", text: "Original" },
  ];
  for (const { name, text } of settingsListboxes) {
    await page.getByText(text, { exact: true }).first().click();
    await page.locator(".listbox-glass").waitFor();
    await page.screenshot({
      path: `.playwright-artifacts/glass-consistency/${name}-${colorScheme}.png`,
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    await page.locator(".listbox-glass").waitFor({ state: "hidden" });
  }

  await page.goto(`${baseURL}#/game/${seed.gameId}`, { waitUntil: "networkidle" });
  await page.getByLabel("Add round 1").click();
  await page.locator(".dialog-glass").waitFor();
  await page.screenshot({
    path: `.playwright-artifacts/glass-consistency/add-round-dialog-${colorScheme}.png`,
    fullPage: true,
  });

  await page.getByText("Choose winner").click();
  await page.locator(".listbox-glass").waitFor();
  await page.screenshot({
    path: `.playwright-artifacts/glass-consistency/add-round-winner-listbox-${colorScheme}.png`,
    fullPage: true,
  });

  await page.keyboard.press("Escape");
  if (!(await page.locator(".dialog-glass").isVisible())) {
    await page.getByLabel("Add round 1").click();
    await page.locator(".dialog-glass").waitFor();
  }

  await page.getByLabel(/Round progress:/).click();
  await page.locator(".popover-glass").waitFor();
  await page.screenshot({
    path: `.playwright-artifacts/glass-consistency/add-round-progress-popover-${colorScheme}.png`,
    fullPage: true,
  });

  await page.close();
}
await browser.close();
NODE
```

Expected: screenshots are written under `.playwright-artifacts/glass-consistency/`, including home/players/create/settings, Settings tiebreaker/skip-penalty/phase-set listboxes, Add Round dialog, Add Round winner listbox, and Add Round progress popover in light and dark mode. Do not commit this directory. The script seeds a disposable active game only inside its Playwright browser context.

- [ ] **Step 3: Inspect captured screenshots**

Run:

```bash
ls .playwright-artifacts/glass-consistency
open .playwright-artifacts/glass-consistency
```

Expected:

- Home, players, create, and settings screenshots exist for light and dark mode.
- Settings tiebreaker, skip-penalty, and phase-set listbox screenshots exist for light and dark mode.
- Add Round dialog, winner listbox, and progress popover screenshots exist for light and dark mode.
- Base glass panels and controls show color bleed without obvious unblurred detail behind text.
- Light-mode buttons and other controls no longer read as opaque gray or white boxes.
- Settings listboxes and Add Round winner listbox feel like the same floating material family.
- Add Round dialog no longer reads as a fully white card.
- Dark-mode surfaces retain visible edges and readable text.

- [ ] **Step 4: Check floating-panel contrast with synthetic backdrops**

Run:

```bash
node --input-type=module <<'NODE'
function srgbToLinear(value) {
  const normalized = value / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrast(a, b) {
  const lighter = Math.max(luminance(a), luminance(b));
  const darker = Math.min(luminance(a), luminance(b));
  return (lighter + 0.05) / (darker + 0.05);
}

function blend(foreground, alpha, background) {
  return foreground.map((channel, index) => Math.round(channel * alpha + background[index] * (1 - alpha)));
}

function applyBrightness(color, amount) {
  return color.map((channel) => Math.max(0, Math.min(255, Math.round(channel * amount))));
}

const lightText = [26, 26, 26];
const darkText = [255, 255, 255];
const lightPanel = [255, 255, 255];
const darkPanel = [18, 18, 18];
const backdrops = {
  black: [0, 0, 0],
  white: [255, 255, 255],
  yellow: [250, 204, 21],
  blue: [59, 130, 246],
};

const lightAlpha = 0.51;
const darkAlpha = 0.32;
const lightBrightness = 1.1;
const darkBrightness = 0.58;

for (const [name, backdrop] of Object.entries(backdrops)) {
  const lightSurface = blend(lightPanel, lightAlpha, applyBrightness(backdrop, lightBrightness));
  const darkSurface = blend(darkPanel, darkAlpha, applyBrightness(backdrop, darkBrightness));
  const lightRatio = contrast(lightText, lightSurface);
  const darkRatio = contrast(darkText, darkSurface);
  console.log(`${name}: light=${lightRatio.toFixed(2)} dark=${darkRatio.toFixed(2)}`);
  if (lightRatio < 4.5) throw new Error(`Light floating contrast failed over ${name}`);
  if (darkRatio < 4.5) throw new Error(`Dark floating contrast failed over ${name}`);
}
NODE
```

Expected: exits 0. If it fails, tune the shared floating role values only, then re-run Task 4 from Step 1.

- [ ] **Step 5: Run Biome**

Run:

```bash
npm run lint
```

Expected: exits 0. If it fails only because an unrelated nested `.worktrees/*/biome.json` is detected, run this narrower validation and record the full-lint blocker:

```bash
npx biome check src docs
```

Expected for the fallback: exits 0.

- [ ] **Step 6: Run the production build**

Run:

```bash
npm run build
```

Expected: exits 0. Existing Vite chunk-size warnings are acceptable.

- [ ] **Step 7: Clean temporary screenshots**

Run:

```bash
rm -rf .playwright-artifacts/glass-consistency
```

Expected: generated screenshots are removed from the working tree after inspection.

- [ ] **Step 8: Review final diff**

Run:

```bash
git --no-pager diff -- src/index.css src/components/ui/Listbox/Listbox.css src/components/ui/Popover/Popover.css src/components/ui/Dialog/Dialog.css
git --no-pager status --short
```

Expected: final implementation diff is limited to the four shared CSS role files. Existing unrelated dirty files remain untouched.

- [ ] **Step 9: Commit implementation**

Run:

```bash
git add src/index.css src/components/ui/Listbox/Listbox.css src/components/ui/Popover/Popover.css src/components/ui/Dialog/Dialog.css
git commit -m "Refine shared glass roles" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

Expected: commit includes only the shared role CSS changes.

- [ ] **Step 10: Stop Vite**

Return to the terminal running `npm run dev` and press `Ctrl+C`.

Expected: the dev server stops after validation is complete.
