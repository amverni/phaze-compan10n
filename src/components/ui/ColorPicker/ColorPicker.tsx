import { Button } from "@headlessui/react";
import { COLOR_GRID, getColorEntry } from "../../../data/constants/colors";

export interface ColorPickerProps {
  /** Color entry name (or legacy hex value). */
  value: string;
  onChange: (colorName: string) => void;
}

function isLightColor(hex: string): boolean {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  // Perceived luminance
  return r * 0.299 + g * 0.587 + b * 0.114 > 160;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const selectedEntry = getColorEntry(value);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-text-secondary">
        Avatar{selectedEntry ? ` · ${selectedEntry.name}` : ""}
      </span>
      <div className="glass relative rounded-xl p-2 [&::after]:opacity-0">
        <div className="overflow-hidden rounded-lg">
          {Array.from({ length: Math.max(...COLOR_GRID.map((c) => c.length)) }, (_, row) => (
            <div key={row} className="flex">
              {COLOR_GRID.map((column) => {
                const { hex, name, icon: Icon } = column[row];
                const isSelected = selectedEntry?.name === name;
                const contrastColor = isLightColor(hex) ? "#000" : "#fff";
                return (
                  <Button
                    key={hex}
                    type="button"
                    aria-label={`Select color ${name}`}
                    className="relative aspect-square flex-1 cursor-pointer"
                    style={{ backgroundColor: hex }}
                    onClick={() => onChange(name)}
                  >
                    {isSelected && (
                      <Icon
                        className="absolute inset-0 m-auto"
                        size={32}
                        strokeWidth={1.5}
                        color={contrastColor}
                      />
                    )}
                  </Button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
