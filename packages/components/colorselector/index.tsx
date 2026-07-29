import { Plus } from "lucide-react";
import React, { useState } from "react";
import { Controller } from "react-hook-form";

const defaultColors = [
  //Black
  "#000000",
  //White
  "#FFFFFF",
  //Red
  "#FF0000",
  //Green
  "#00FF00",
  //Blue
  "#0000FF",
  //Yellow
  "#FFFF00",
  //Cyan
  "#00FFFF",
  //Magenta
  "#FF00FF",
];

const ColorSelector = ({ control, errors }: any) => {
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newColor, setNewColor] = useState("#ffffff");

  return (
    <div>
      <label className="block text-sm font-medium text-[#292524] mb-2">
        Colors
      </label>
      <Controller
        name="colors"
        control={control}
        render={({ field }) => (
          <div className="flex flex-wrap items-center gap-2.5">
            {[...defaultColors, ...customColors].map((color) => {
              const isSelected = (field.value || []).includes(color);
              const isLightColor = ["#ffffff", "#ffff00"].includes(color);

              return (
                <button
                  type="button"
                  key={color}
                  onClick={() =>
                    field.onChange(
                      isSelected
                        ? field.value.filter((c: string) => c !== color)
                        : [...(field.value || []), color],
                    )
                  }
                  className={`w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 ${isSelected ? "border-[#059669] scale-110 shadow-[0_4px_12px_-2px_rgba(5,150,105,0.4)]" : "border-[#E7E5E4]"} ${isLightColor ? "border-[#E7E5E4]" : ""}`}
                  style={{ backgroundColor: color }}
                ></button>
              );
            })}
            {/*Add new color*/}
            <button
              type="button"
              onClick={() => setShowColorPicker(true)}
              className="w-8 h-8 rounded-full border-2 border-dashed border-[#E7E5E4] flex items-center justify-center text-[#78716C] transition-all duration-200 hover:border-[#059669] hover:text-[#059669] hover:scale-110"
            >
              <Plus size={16} />
            </button>

            {/*Color picker*/}
            {showColorPicker && (
              <div className="flex items-center gap-2 bg-white border border-[#E7E5E4] rounded-2xl px-3 py-2 shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] animate-[dropdown-in_150ms_ease-out]">
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-[#E7E5E4] cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCustomColors([...customColors, newColor]);
                    setShowColorPicker(false);
                  }}
                  className="px-3 py-1.5 bg-[#059669] hover:bg-[#047857] text-white text-sm font-medium rounded-full transition-all duration-200 hover:-translate-y-0.5"
                >
                  Add Color
                </button>
              </div>
            )}
          </div>
        )}
      />
    </div>
  );
};

export default ColorSelector;
