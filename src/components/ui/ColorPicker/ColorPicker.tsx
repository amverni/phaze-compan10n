import { Button } from "@headlessui/react";
import { COLOR_GRID, getColorEntry } from "../../../data/constants/colors";
import { getContrastColor } from "../../../utils";

export interface ColorPickerProps {
  /** Color entry name (or legacy hex value). */
  value: string;
  onChange: (colorName: string) => void;
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
                const contrastColor = getContrastColor(hex);
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
