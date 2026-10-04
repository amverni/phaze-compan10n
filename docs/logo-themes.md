# Logo Themes

Logo Themes change only decorative logo stripe colors and count. The approved catalog and calendar live in [issue #43](https://github.com/amverni/scorekeeper/issues/43).

Edit the named palettes in [`palettes.ts`](../src/components/Logo/themes/palettes.ts) and their schedule in [`config.ts`](../src/components/Logo/themes/config.ts). These checked-in TypeScript files are the authoring surface; there is no settings screen, storage, network feed, or runtime override.

## Palettes and bases

The configuration has separate `base.scorekeeper` and `base.phaseCompan10n` palettes. Scorekeeper uses Arcade; Phase Compan10n retains its four original CSS color references.

A palette contains two, three, or four colors in top-to-bottom order. Two colors expand to four stripes, A/B/A/B. Three and four colors keep their supplied order and count. Repeated colors are intentional, including the adjacent blue stripes in Lions; they are never deduplicated.

Use solid `#RGB` or `#RRGGBB` colors. The only CSS references accepted are the existing Phase base colors: `var(--color-pt-red-500)`, `var(--color-pt-blue-500)`, `var(--color-pt-green-500)`, and `var(--color-pt-yellow-500)`. Keep custom colors together in `palettes.ts`, not in renderers or unrelated UI tokens.

A shared palette applies unchanged in both appearances. To specify different appearances, supply both `light` and `dark`:

```ts
christmas: ["#DC2626", "#16A34A"],
halloween: {
  light: ["#080808", "#F97316"],
  dark: ["#6D28D9", "#F97316"],
},
```

Light and dark tuples can have different counts. This also works for bases. Colors are used literally: no automatic contrast correction, off-white replacement, lightening, gradients, or blending.

## Scheduling and precedence

Each theme entry has exactly three fields:

```ts
{
  colors: palettes.christmas,
  scope: "all",
  dates: [{ kind: "annual-range", from: "12-21", through: "12-30" }],
},
{
  colors: palettes.halloween,
  scope: "all",
  dates: [{ kind: "annual-date", on: "10-31" }],
},
```

`scope` is `"scorekeeper"` for the Scorekeeper app alone or `"all"` for both Scorekeepers. There is no Phase-only scope. `dates` must be nonempty.

For each Scorekeeper independently, selection skips entries outside its scope and uses the first remaining entry with any matching date rule. Reorder entries to change precedence. There are no `name`, `id`, `enabled`, or `priority` fields and no implicit specificity ranking. A year-specific exception must precede the recurring theme it overrides:

```ts
{
  colors: palettes.newYear,
  scope: "all",
  dates: [{ kind: "date", on: "2027-12-25" }],
},
```

The shipped order is special days, holidays, football, then ordinary seasons. Halloween therefore wins over Saturday Michigan; USA holiday windows win over football and seasons. Only shared holidays and special dates change Phase Compan10n. Ordinary autumn weekdays fall back to each Scorekeeper's base.

## Date rules

All endpoints are inclusive and use the viewer's device-local Gregorian calendar.

| Kind | Required fields | Meaning |
| --- | --- | --- |
| `annual-date` | `on: "MM-DD"` | Repeats on that month/day |
| `annual-range` | `from`, `through`: `"MM-DD"` | Repeats annually; reversed endpoints wrap New Year |
| `date` | `on: "YYYY-MM-DD"` | One date in a specific year |
| `range` | `from`, `through`: `"YYYY-MM-DD"` | One inclusive, chronologically ordered range |
| `annual-weekday-window` | `month`, `occurrence`, `weekday`, `fromOffset`, `throughOffset` | Repeats around a weekday anchor |

Use zero-padded date strings. Equal range endpoints mean one day, not the whole year. Annual February 29 is valid but only matches a real leap day. An annual range ending February 29 includes February 28 in non-leap years without shifting the endpoint into March. Invalid year-qualified dates and reversed year-qualified ranges are errors.

Every rule can include a nonempty `weekdays` array using lowercase English names from `"sunday"` through `"saturday"`. The filter and date condition must both match; separate rules in `dates` are alternatives:

```ts
{
  kind: "annual-range",
  from: "12-01",
  through: "02-29",
  weekdays: ["saturday", "sunday"],
}
```

Weekday anchors use integer months 1-12, `occurrence` 1-5 or `"last"`, and a weekday name. A nonexistent fifth occurrence is inactive that year. Offsets must be integers from -31 through +31 with `fromOffset <= throughOffset`; they may cross month and year boundaries. Larger windows belong in annual ranges.

The USA Memorial Day window runs from the Wednesday before the last Monday in May through the following Tuesday, not a Monday-Sunday calendar week:

```ts
{
  colors: palettes.usa,
  scope: "all",
  dates: [{
    kind: "annual-weekday-window",
    month: 5,
    occurrence: "last",
    weekday: "monday",
    fromOffset: -5,
    throughOffset: 1,
  }],
}
```

In the shipped config this rule shares one USA entry with July 1-7 and the equivalent first-Monday-in-September window. Football windows are recurring presentation approximations, not actual game schedules.

## Validation and runtime

[`validateLogoThemeConfig`](../src/components/Logo/themes/validate.ts) runs from `vite.config.ts` before serving or building. Errors identify the authoring location, such as `themes[3].dates[0].through` or `base.scorekeeper.dark[2]`. Correct that field before restarting. Missing bases, malformed colors or dates, unsupported fields/scopes, incomplete appearance pairs, empty rule/filter lists, and invalid anchors/offsets are rejected rather than silently falling back. Empty `themes`, overlapping schedules, and repeated colors are valid.

[`LogoThemeProvider`](../src/components/Logo/LogoThemeProvider.tsx) is mounted once above routes. It resolves the initial palettes synchronously, observes system appearance, and shares one timer scheduled for the next local midnight. Focus and return-to-visible events catch up suspended tabs and re-arm the timer. Local calendar construction handles daylight-saving changes; no 24-hour polling interval is used. Clock or timezone changes are picked up on the next timer or focus/visibility event. Unchanged effective palettes do not publish a new context value.

The separate renderers preserve lettering, positioning, stripe direction, accessibility, and Safe Area Visual Bleed. See [shared presentation contracts](shared-presentation.md#logo-presentation) for geometry.

## Coverage

Run the existing focused tests after editing:

```bash
npm test -- src/components/Logo/themes src/components/Logo/logoThemes.browser.test.ts
```

Pure tests cover calendar arithmetic, validation, palette selection, and independent expectations for the shipped catalog. Browser tests cover routes, exact colors, fixed geometry, appearance changes, midnight/DST, catch-up, and shared lifecycle cleanup. The appearance-count fixture under `src/components/Logo/test-fixtures/` is development-test-only, not a production route or build entry. Existing base-color layout tests fix their clock to October 6, 2026 so results do not depend on the day they run.
