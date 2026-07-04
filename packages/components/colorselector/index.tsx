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
      <label>Colors</label>
      <Controller
        name="colors"
        control={control}
        render={({ field }) => (
          <div>
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
                  className={`w-8 h-8 rounded-full border-2 ${isSelected ? "border-black" : "border-gray-300"} ${isLightColor ? "border-gray-400" : ""}`}
                  style={{ backgroundColor: color }}
                ></button>
              );
            })}
            {/*Add new color*/}
            <button type="button" onClick={() => setShowColorPicker(true)}>
              <Plus />
            </button>

            {/*Color picker*/}
            {showColorPicker && (
              <div>
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => {
                    setCustomColors([...customColors, newColor]);
                    setShowColorPicker(false);
                  }}
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
