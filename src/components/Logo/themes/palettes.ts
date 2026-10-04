import type { PaletteChoice } from "./types";

export const palettes = {
  arcade: ["#2563EB", "#06B6D4", "#8B5CF6", "#EC4899"],
  phaseBase: [
    "var(--color-pt-red-500)",
    "var(--color-pt-blue-500)",
    "var(--color-pt-green-500)",
    "var(--color-pt-yellow-500)",
  ],
  christmas: ["#DC2626", "#16A34A"],
  halloween: {
    light: ["#080808", "#F97316"],
    dark: ["#6D28D9", "#F97316"],
  },
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
} as const satisfies Record<string, PaletteChoice>;
