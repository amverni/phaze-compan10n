import { describe, expect, it } from "vitest";
import { logoThemeConfig } from "./config";
import { palettes } from "./palettes";
import { resolveLogoPalette } from "./resolve";
import { validateLogoThemeConfig } from "./validate";

const arcade = ["#2563EB", "#06B6D4", "#8B5CF6", "#EC4899"];
const phaseBase = [
  "var(--color-pt-red-500)",
  "var(--color-pt-blue-500)",
  "var(--color-pt-green-500)",
  "var(--color-pt-yellow-500)",
];
const sharedWindows = {
  christmas: ["#DC2626", "#16A34A", "#DC2626", "#16A34A"],
  newYear: ["#003C7D", "#D4B483", "#003C7D", "#D4B483"],
  thanksgiving: ["#C75B12", "#A61B1B", "#DCA81D", "#683A1D"],
  usa: ["#B31942", "#FFFFFF", "#0A3161"],
};
const sports = {
  michigan: ["#00274C", "#FFCB05", "#00274C", "#FFCB05"],
  lions: ["#B0B7BC", "#0076B6", "#0076B6", "#B0B7BC"],
};
const seasons = {
  openOcean: ["#E0F2FE", "#7DD3FC", "#0EA5E9", "#075985"],
  lagoon: ["#A7F3D0", "#2DD4BF", "#0E7490"],
  shoreline: ["#E8D5B5", "#9FE3D1", "#0F9BAB", "#075985"],
  mountain: ["#F5C451", "#7D8790", "#0F9BAB", "#163832"],
  winterForest: ["#DCE8E2", "#75968A", "#255B49"],
  frost: ["#DCEFF5", "#A7C4D4", "#4A7FA5", "#1E3A5F"],
};

describe("shipped logo theme catalog", () => {
  it("contains exactly the authoritative palette values from issue #43", () => {
    expect(palettes).toEqual({
      arcade: ["#2563EB", "#06B6D4", "#8B5CF6", "#EC4899"],
      phaseBase: [
        "var(--color-pt-red-500)",
        "var(--color-pt-blue-500)",
        "var(--color-pt-green-500)",
        "var(--color-pt-yellow-500)",
      ],
      christmas: ["#DC2626", "#16A34A"],
      halloween: { light: ["#080808", "#F97316"], dark: ["#6D28D9", "#F97316"] },
      newYear: ["#003C7D", "#D4B483"],
      valentine: ["#F9A8D4", "#DC2626"],
      thanksgiving: ["#C75B12", "#A61B1B", "#DCA81D", "#683A1D"],
      usa: ["#B31942", "#FFFFFF", "#0A3161"],
      january14: ["#96D8D8", "#639FB6", "#C8102E", "#001425"],
      september9: ["#F9A8D4", "#003C7D"],
      september15: ["#FBCFE8", "#D4B483"],
      michigan: ["#00274C", "#FFCB05"],
      lions: ["#B0B7BC", "#0076B6", "#0076B6", "#B0B7BC"],
      openOcean: ["#E0F2FE", "#7DD3FC", "#0EA5E9", "#075985"],
      lagoon: ["#A7F3D0", "#2DD4BF", "#0E7490"],
      shoreline: ["#E8D5B5", "#9FE3D1", "#0F9BAB", "#075985"],
      mountain: ["#F5C451", "#7D8790", "#0F9BAB", "#163832"],
      winterForest: ["#DCE8E2", "#75968A", "#255B49"],
      frost: ["#DCEFF5", "#A7C4D4", "#4A7FA5", "#1E3A5F"],
    });
  });

  it("validates the shipped config and keeps separate bases on ordinary autumn weekdays", () => {
    expect(() => validateLogoThemeConfig(logoThemeConfig)).not.toThrow();
    for (const appearance of ["light", "dark"] as const) {
      expect(
        resolveLogoPalette(
          logoThemeConfig,
          "scorekeeper",
          { year: 2026, month: 10, day: 6 },
          appearance,
        ),
      ).toEqual(arcade);
      expect(
        resolveLogoPalette(
          logoThemeConfig,
          "phaseCompan10n",
          { year: 2026, month: 10, day: 6 },
          appearance,
        ),
      ).toEqual(phaseBase);
    }
  });

  it("keeps exactly the approved 17 entries in author-controlled priority order", () => {
    expect(logoThemeConfig.themes.map((theme) => theme.colors)).toEqual([
      palettes.january14,
      palettes.september9,
      palettes.september15,
      palettes.valentine,
      palettes.halloween,
      palettes.christmas,
      palettes.newYear,
      palettes.thanksgiving,
      palettes.usa,
      palettes.michigan,
      palettes.lions,
      palettes.openOcean,
      palettes.lagoon,
      palettes.shoreline,
      palettes.mountain,
      palettes.winterForest,
      palettes.frost,
    ]);
  });

  it.each([
    [1, 14, ["#96D8D8", "#639FB6", "#C8102E", "#001425"]],
    [9, 9, ["#F9A8D4", "#003C7D", "#F9A8D4", "#003C7D"]],
    [9, 15, ["#FBCFE8", "#D4B483", "#FBCFE8", "#D4B483"]],
    [2, 14, ["#F9A8D4", "#DC2626", "#F9A8D4", "#DC2626"]],
  ] as const)("shares special day %i-%i across experiences and appearances", (month, day, expected) => {
    for (const year of [2026, 2027, 2028]) {
      for (const experience of ["scorekeeper", "phaseCompan10n"] as const) {
        for (const appearance of ["light", "dark"] as const) {
          expect(
            resolveLogoPalette(logoThemeConfig, experience, { year, month, day }, appearance),
          ).toEqual(expected);
        }
      }
    }
  });

  it("uses exact Halloween mode colors, overriding Saturday and Sunday football", () => {
    for (const year of [2026, 2027, 2028]) {
      for (const experience of ["scorekeeper", "phaseCompan10n"] as const) {
        expect(
          resolveLogoPalette(logoThemeConfig, experience, { year, month: 10, day: 31 }, "light"),
        ).toEqual(["#080808", "#F97316", "#080808", "#F97316"]);
        expect(
          resolveLogoPalette(logoThemeConfig, experience, { year, month: 10, day: 31 }, "dark"),
        ).toEqual(["#6D28D9", "#F97316", "#6D28D9", "#F97316"]);
      }
    }
  });

  it.each([
    [1, 13],
    [1, 15],
    [9, 10],
    [9, 14],
    [9, 16],
    [2, 13],
    [2, 15],
    [10, 30],
    [11, 1],
  ])("does not extend a shared special day to 2026-%i-%i", (month, day) => {
    for (const appearance of ["light", "dark"] as const) {
      expect(
        resolveLogoPalette(
          logoThemeConfig,
          "phaseCompan10n",
          { year: 2026, month, day },
          appearance,
        ),
      ).toEqual(phaseBase);
    }
  });

  it.each([
    [2026, 12, 21, "christmas"],
    [2026, 12, 25, "christmas"],
    [2026, 12, 30, "christmas"],
    [2026, 12, 31, "newYear"],
    [2027, 1, 1, "newYear"],
    [2027, 1, 2, "newYear"],
    [2027, 1, 3, "newYear"],
    [2027, 1, 4, "newYear"],
    [2027, 12, 21, "christmas"],
    [2027, 12, 30, "christmas"],
    [2027, 12, 31, "newYear"],
    [2028, 1, 4, "newYear"],
    [2028, 12, 21, "christmas"],
    [2028, 12, 30, "christmas"],
    [2026, 5, 20, "usa"],
    [2026, 5, 21, "usa"],
    [2026, 5, 22, "usa"],
    [2026, 5, 23, "usa"],
    [2026, 5, 24, "usa"],
    [2026, 5, 25, "usa"],
    [2026, 5, 26, "usa"],
    [2026, 9, 2, "usa"],
    [2026, 9, 3, "usa"],
    [2026, 9, 4, "usa"],
    [2026, 9, 5, "usa"],
    [2026, 9, 6, "usa"],
    [2026, 9, 7, "usa"],
    [2026, 9, 8, "usa"],
    [2026, 7, 1, "usa"],
    [2026, 7, 2, "usa"],
    [2026, 7, 3, "usa"],
    [2026, 7, 4, "usa"],
    [2026, 7, 5, "usa"],
    [2026, 7, 6, "usa"],
    [2026, 7, 7, "usa"],
    [2027, 5, 26, "usa"],
    [2027, 5, 31, "usa"],
    [2027, 6, 1, "usa"],
    [2027, 9, 1, "usa"],
    [2027, 9, 6, "usa"],
    [2027, 9, 7, "usa"],
    [2028, 5, 24, "usa"],
    [2028, 5, 29, "usa"],
    [2028, 5, 30, "usa"],
    [2028, 8, 30, "usa"],
    [2028, 9, 4, "usa"],
    [2028, 9, 5, "usa"],
    [2026, 11, 25, "thanksgiving"],
    [2026, 11, 26, "thanksgiving"],
    [2026, 11, 27, "thanksgiving"],
    [2027, 11, 24, "thanksgiving"],
    [2027, 11, 25, "thanksgiving"],
    [2027, 11, 26, "thanksgiving"],
    [2028, 11, 22, "thanksgiving"],
    [2028, 11, 23, "thanksgiving"],
    [2028, 11, 24, "thanksgiving"],
  ] as const)("selects shared %i-%i-%i as %s with exact rendered colors", (year, month, day, key) => {
    for (const experience of ["scorekeeper", "phaseCompan10n"] as const) {
      for (const appearance of ["light", "dark"] as const) {
        expect(
          resolveLogoPalette(logoThemeConfig, experience, { year, month, day }, appearance),
        ).toEqual(sharedWindows[key]);
      }
    }
  });

  it.each([
    [2026, 5, 19],
    [2026, 5, 27],
    [2026, 9, 1],
    [2026, 9, 10],
    [2026, 6, 30],
    [2026, 7, 8],
    [2026, 11, 24],
    [2026, 11, 28],
    [2026, 12, 20],
    [2027, 1, 5],
    [2027, 5, 25],
    [2027, 6, 2],
    [2027, 8, 31],
    [2027, 9, 8],
    [2027, 11, 23],
    [2027, 11, 27],
    [2027, 12, 20],
    [2028, 1, 5],
    [2028, 5, 23],
    [2028, 5, 31],
    [2028, 8, 29],
    [2028, 9, 6],
    [2028, 11, 21],
    [2028, 11, 25],
  ])("returns Phase to its base outside shared windows on %i-%i-%i", (year, month, day) => {
    for (const appearance of ["light", "dark"] as const) {
      expect(
        resolveLogoPalette(logoThemeConfig, "phaseCompan10n", { year, month, day }, appearance),
      ).toEqual(phaseBase);
    }
  });

  it.each([
    [2026, 8, 29, "michigan"],
    [2026, 9, 12, "michigan"],
    [2026, 11, 28, "michigan"],
    [2026, 12, 5, "michigan"],
    [2027, 8, 28, "michigan"],
    [2027, 12, 4, "michigan"],
    [2028, 8, 26, "michigan"],
    [2028, 12, 2, "michigan"],
    [2025, 8, 23, "michigan"],
    [2030, 12, 7, "michigan"],
    [2025, 9, 7, "lions"],
    [2026, 9, 13, "lions"],
    [2026, 10, 4, "lions"],
    [2026, 12, 20, "lions"],
    [2027, 1, 10, "lions"],
    [2027, 9, 12, "lions"],
    [2028, 1, 9, "lions"],
    [2028, 9, 10, "lions"],
  ] as const)("selects Scorekeeper-only sports %i-%i-%i as %s", (year, month, day, key) => {
    for (const appearance of ["light", "dark"] as const) {
      expect(
        resolveLogoPalette(logoThemeConfig, "scorekeeper", { year, month, day }, appearance),
      ).toEqual(sports[key]);
      expect(
        resolveLogoPalette(logoThemeConfig, "phaseCompan10n", { year, month, day }, appearance),
      ).toEqual(phaseBase);
    }
  });

  it.each([
    [2026, 1, 5, "winterForest"],
    [2026, 1, 13, "winterForest"],
    [2026, 1, 15, "winterForest"],
    [2026, 1, 10, "frost"],
    [2026, 1, 11, "frost"],
    [2026, 2, 28, "frost"],
    [2026, 3, 1, "lagoon"],
    [2026, 3, 2, "openOcean"],
    [2026, 5, 19, "openOcean"],
    [2026, 5, 27, "openOcean"],
    [2026, 5, 29, "openOcean"],
    [2026, 5, 30, "lagoon"],
    [2026, 5, 31, "lagoon"],
    [2026, 6, 1, "shoreline"],
    [2026, 6, 6, "mountain"],
    [2026, 6, 30, "shoreline"],
    [2026, 7, 8, "shoreline"],
    [2026, 8, 22, "mountain"],
    [2026, 8, 23, "mountain"],
    [2026, 8, 24, "shoreline"],
    [2026, 8, 30, "mountain"],
    [2026, 8, 31, "shoreline"],
    [2026, 12, 1, "winterForest"],
    [2026, 12, 7, "winterForest"],
    [2026, 12, 8, "winterForest"],
    [2026, 12, 12, "frost"],
    [2026, 12, 19, "frost"],
    [2027, 1, 5, "winterForest"],
    [2027, 1, 17, "frost"],
    [2027, 2, 28, "frost"],
    [2027, 3, 1, "openOcean"],
    [2027, 5, 25, "openOcean"],
    [2027, 6, 2, "shoreline"],
    [2027, 6, 5, "mountain"],
    [2027, 8, 22, "mountain"],
    [2027, 8, 23, "shoreline"],
    [2027, 8, 29, "mountain"],
    [2027, 8, 31, "shoreline"],
    [2027, 12, 1, "winterForest"],
    [2027, 12, 7, "winterForest"],
    [2027, 12, 11, "frost"],
    [2028, 1, 5, "winterForest"],
    [2028, 1, 15, "frost"],
    [2028, 1, 16, "frost"],
    [2028, 2, 28, "winterForest"],
    [2028, 2, 29, "winterForest"],
    [2028, 3, 1, "openOcean"],
    [2028, 3, 4, "lagoon"],
    [2028, 6, 1, "shoreline"],
    [2028, 6, 3, "mountain"],
    [2028, 8, 27, "mountain"],
    [2028, 8, 28, "shoreline"],
    [2028, 8, 29, "shoreline"],
    [2028, 12, 1, "winterForest"],
    [2028, 12, 9, "frost"],
    [2032, 2, 29, "frost"],
  ] as const)("selects Scorekeeper-only season %i-%i-%i as %s", (year, month, day, key) => {
    for (const appearance of ["light", "dark"] as const) {
      expect(
        resolveLogoPalette(logoThemeConfig, "scorekeeper", { year, month, day }, appearance),
      ).toEqual(seasons[key]);
      expect(
        resolveLogoPalette(logoThemeConfig, "phaseCompan10n", { year, month, day }, appearance),
      ).toEqual(phaseBase);
    }
  });

  it.each([
    [2026, 9, 1],
    [2026, 9, 17],
    [2026, 10, 6],
    [2026, 10, 30],
    [2026, 11, 24],
    [2026, 11, 30],
    [2027, 11, 30],
    [2028, 11, 30],
  ])("has no ordinary autumn override on %i-%i-%i", (year, month, day) => {
    for (const appearance of ["light", "dark"] as const) {
      expect(
        resolveLogoPalette(logoThemeConfig, "scorekeeper", { year, month, day }, appearance),
      ).toEqual(arcade);
      expect(
        resolveLogoPalette(logoThemeConfig, "phaseCompan10n", { year, month, day }, appearance),
      ).toEqual(phaseBase);
    }
  });
});
