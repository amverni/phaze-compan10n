import { useState } from "react";
import { HexColorPicker } from "react-colorful";

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#a855f7", // purple
  "#ec4899", // pink
  "#f43f5e", // rose
  "#06b6d4", // cyan
  "#84cc16", // lime
];

export interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [showFullPicker, setShowFullPicker] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      {/* Preset swatches */}
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Select color ${color}`}
            className="h-8 w-8 shrink-0 cursor-pointer rounded-full border-2 transition-all duration-150"
            style={{
              backgroundColor: color,
              borderColor: value === color ? "white" : "transparent",
              boxShadow: value === color ? `0 0 0 2px ${color}` : "none",
            }}
            onClick={() => {
              onChange(color);
              setShowFullPicker(false);
            }}
          />
        ))}

        {/* Rainbow toggle button */}
        <button
          type="button"
          aria-label="Open color picker"
          className="h-8 w-8 shrink-0 cursor-pointer rounded-full border-2 transition-all duration-150"
          style={{
            background:
              "conic-gradient(#ef4444, #eab308, #22c55e, #3b82f6, #a855f7, #ec4899, #ef4444)",
            borderColor: showFullPicker && !PRESET_COLORS.includes(value) ? "white" : "transparent",
          }}
          onClick={() => setShowFullPicker((prev) => !prev)}
        />
      </div>

      {/* Full color picker */}
      {showFullPicker && (
        <HexColorPicker color={value} onChange={onChange} style={{ width: "100%" }} />
      )}
    </div>
  );
}
