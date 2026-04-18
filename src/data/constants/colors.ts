import {
  bullHead,
  catBig,
  cheese,
  foxFaceTail,
  golfDriver,
  lemon,
  shark,
  snowman,
  strawberry,
} from "@lucide/lab";
import {
  Anchor,
  Cherry,
  CloudLightning,
  Crown,
  CupSoda,
  createLucideIcon,
  Dog,
  IceCream,
  Landmark,
  Leaf,
  MoonStar,
  MountainSnow,
  PawPrint,
  Popsicle,
  Rose,
  Siren,
  SunSnow,
  Sword,
  Wheat,
} from "lucide-react";
import type { ColorEntry } from "../../types";

const Cheese = createLucideIcon("Cheese", cheese);
const BullHead = createLucideIcon("BullHead", bullHead);
const Shark = createLucideIcon("Shark", shark);
const FoxFaceTail = createLucideIcon("FoxFaceTail", foxFaceTail);
const Lemon = createLucideIcon("Lemon", lemon);
const GolfDriver = createLucideIcon("GolfDriver", golfDriver);
const Strawberry = createLucideIcon("Strawberry", strawberry);
const CatBig = createLucideIcon("CatBig", catBig);
const Snowman = createLucideIcon("Snowman", snowman);

// Each sub-array is a hue column, from dark (top) to light (bottom)
export const COLOR_GRID: ColorEntry[][] = [
  // 🌸 Pink
  [
    { hex: "#df0e88", name: "Jam", icon: Strawberry },
    { hex: "#ff66a6", name: "Panther", icon: CatBig },
    { hex: "#ff99c3", name: "Blossom", icon: Cherry },
  ],
  // 🔴 Red
  [
    { hex: "#A00000", name: "Rose", icon: Rose },
    { hex: "#e9072b", name: "Siren", icon: Siren },
    { hex: "#FD5E53", name: "Sorbet", icon: IceCream },
  ],

  // 🟠 Orange
  [
    { hex: "#bf5700", name: "Longhorn", icon: BullHead },
    { hex: "#FC931E", name: "Cheddar", icon: Cheese },
    { hex: "#feaf68", name: "Creamsicle", icon: Popsicle },
  ],

  // 🟡 Yellow
  [
    { hex: "#C2980C", name: "Reign", icon: Crown },
    { hex: "#ffcb05", name: "Wolverine", icon: FoxFaceTail },
    { hex: "#faf438", name: "Limoncello", icon: Lemon },
  ],

  // 🟢 Green
  [
    { hex: "#18453B", name: "Spartan", icon: Sword },
    { hex: "#16A34A", name: "Spearmint", icon: Leaf },
    { hex: "#92F073", name: "Fairway", icon: GolfDriver },
  ],

  // 🌊 Teal (Blue-Green)
  [
    { hex: "#006D75", name: "Pacific", icon: Shark },
    { hex: "#2ad2c9", name: "Diablo", icon: MountainSnow },
    { hex: "#99F6E4", name: "Lagoon", icon: SunSnow },
  ],

  // 🔵 Blue (Deep)
  [
    { hex: "#00274C", name: "Midnight", icon: PawPrint },
    { hex: "#1D4ED8", name: "Santorini", icon: Landmark },
    { hex: "#84cfff", name: "Yeti", icon: Snowman },
  ],

  // 🟣 Purple
  [
    { hex: "#4B008C", name: "Husky", icon: Dog },
    { hex: "#9636ff", name: "Lupine", icon: Wheat },
    { hex: "#c896ff", name: "Taro", icon: CupSoda },
  ],

  // ⚫ Neutral (Gray scale)
  [
    { hex: "#111827", name: "Storm", icon: CloudLightning },
    { hex: "#355464", name: "Anchor", icon: Anchor },
    { hex: "#C4C4C4", name: "Moonlight", icon: MoonStar },
  ],
];

const ALL_COLORS = COLOR_GRID.flat();

const COLOR_BY_NAME = new Map(ALL_COLORS.map((c) => [c.name.toLowerCase(), c]));
const COLOR_BY_HEX = new Map(ALL_COLORS.map((c) => [c.hex.toUpperCase(), c]));

/** Resolve a ColorEntry by name first, then by hex (for legacy data). */
export function getColorEntry(nameOrHex: string): ColorEntry | undefined {
  return COLOR_BY_NAME.get(nameOrHex.toLowerCase()) ?? COLOR_BY_HEX.get(nameOrHex.toUpperCase());
}

export function getRandomColorName(): string {
  return ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)].name;
}
