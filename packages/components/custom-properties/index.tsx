// Path: packages/components/custom-properties/index.tsx
import React, { useState, useEffect } from "react";
import { Controller } from "react-hook-form";
import Input from "../input";
import { PlusCircleIcon, X } from "lucide-react";

const CustomProperties = ({ control, errors }: any) => {
  const [properties, setProperties] = useState<
    { label: string; values: string[] }[]
  >([]);
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");

  return (
    <div>
      <Controller
        name="customProperties"
        control={control}
        render={({ field }) => {
          useEffect(() => {
            field.onChange(properties);
          }, [properties]);

          const addProperty = () => {
            if (!newLabel.trim()) return;
            setProperties([...properties, { label: newLabel, values: [] }]);
            setNewLabel("");
          };

          const addValue = (index: number) => {
            if (!newValue.trim()) return;
            const updated = [...properties];
            updated[index].values.push(newValue);
            setProperties(updated);
            setNewValue("");
          };

          const removeProperty = (index: number) =>
            setProperties(properties.filter((_, i) => i !== index));

          return (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Custom Properties
              </label>

              {properties.map((property, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {property.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeProperty(index)}
                      className="text-gray-400 hover:text-red-500 transition"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter value"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => addValue(index)}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {property.values.map((val, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {val}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex gap-2">
                <Input
                  placeholder="Enter property label"
                  value={newLabel}
                  onChange={(e: any) => setNewLabel(e.target.value)}
                />
                <button
                  type="button"
                  onClick={addProperty}
                  className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition shrink-0"
                >
                  <PlusCircleIcon size={16} /> Add
                </button>
              </div>

              {errors.customProperties && (
                <p className="text-red-500 text-xs">
                  {errors.customProperties.message as string}
                </p>
              )}
            </div>
          );
        }}
      />
    </div>
  );
};

export default CustomProperties;
