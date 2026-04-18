import { Button } from "@headlessui/react";
import {
  bullHead,
  catBig,
  cheese,
  foxFaceTail,
  golfDriver,
  lemon,
  shark,
  strawberry,
} from "@lucide/lab";
import type { LucideIcon } from "lucide-react";
import {
  Anchor,
  Check,
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

const Cheese = createLucideIcon("Cheese", cheese);
const BullHead = createLucideIcon("BullHead", bullHead);
const Shark = createLucideIcon("Shark", shark);
const FoxFaceTail = createLucideIcon("FoxFaceTail", foxFaceTail);
const Lemon = createLucideIcon("Lemon", lemon);
const GolfDriver = createLucideIcon("GolfDriver", golfDriver);
const Strawberry = createLucideIcon("Strawberry", strawberry);
const CatBig = createLucideIcon("CatBig", catBig);

interface ColorEntry {
  hex: string;
  name: string;
  icon: LucideIcon;
}

// Each sub-array is a hue column, from dark (top) to light (bottom)
const COLOR_GRID: ColorEntry[][] = [
  // 🌸 Pink
  [
    { hex: "#df0e88", name: "Jam", icon: Strawberry }, //f32ba5, 9B1C5C
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
    { hex: "#FC931E", name: "Cheddar", icon: Cheese }, // ff6600
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
    { hex: "#84cfff", name: "Sky", icon: Check },
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

export interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

function isLightColor(hex: string): boolean {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  // Perceived luminance
  return r * 0.299 + g * 0.587 + b * 0.114 > 160;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const selectedEntry = COLOR_GRID.flat().find(
    (entry) => entry.hex.toUpperCase() === value?.toUpperCase(),
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-xl bg-white p-2 shadow-[0_2px_12px_rgba(0,0,0,0.12)] dark:bg-neutral-900 dark:shadow-[0_2px_16px_rgba(0,0,0,0.5)]">
        <div
          className="grid overflow-hidden rounded-lg"
          style={{ gridTemplateColumns: `repeat(${COLOR_GRID.length}, 1fr)` }}
        >
          {/* Render column by column, but CSS grid fills row-first, so we transpose */}
          {Array.from({ length: Math.max(...COLOR_GRID.map((c) => c.length)) }, (_, row) => {
            const rowCount = Math.max(...COLOR_GRID.map((c) => c.length));
            const isFirstRow = row === 0;
            const isLastRow = row === rowCount - 1;
            return COLOR_GRID.map((column, col) => {
              const entry = column[row];
              if (!entry) return <div key={`empty-${row}-${column[0].hex}`} />;
              const { hex, name, icon: Icon } = entry;
              const isSelected = value?.toUpperCase() === hex.toUpperCase();
              const contrastColor = isLightColor(hex) ? "#000" : "#fff";
              const isFirstCol = col === 0;
              const isLastCol = col === COLOR_GRID.length - 1;
              const borderRadius = [
                isFirstRow && isFirstCol ? "8px" : "0",
                isFirstRow && isLastCol ? "8px" : "0",
                isLastRow && isLastCol ? "8px" : "0",
                isLastRow && isFirstCol ? "8px" : "0",
              ].join(" ");
              return (
                <Button
                  key={hex}
                  type="button"
                  aria-label={`Select color ${name}`}
                  className="relative aspect-square w-full cursor-pointer"
                  style={{
                    backgroundColor: hex,
                    borderRadius,
                    boxShadow: isSelected
                      ? `inset 0 0 0 2px ${hex}, inset 0 0 0 4px ${contrastColor}`
                      : "none",
                  }}
                  onClick={() => onChange(hex)}
                >
                  {isSelected && (
                    <Icon
                      className="absolute inset-0 m-auto"
                      size={20}
                      strokeWidth={2}
                      color={contrastColor}
                    />
                  )}
                </Button>
              );
            });
          })}
        </div>
      </div>
      {selectedEntry && (
        <p className="text-center text-sm text-text-secondary">{selectedEntry.name}</p>
      )}
    </div>
  );
}
