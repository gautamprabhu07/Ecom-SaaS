import React, { useState, useEffect } from "react";
import { Controller, useFieldArray } from "react-hook-form";
import Input from "../input";
import { PlusCircleIcon, Trash2, X } from "lucide-react";

const CustomProperties = ({ control, errors }: any) => {
  const [properties, setProperties] = useState<
    {
      label: string;
      values: string[];
    }[]
  >([]);
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");

  return (
    <div>
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
              const updatedProperties = [...properties];
              updatedProperties[index].values.push(newValue);
              setProperties(updatedProperties);
              setNewValue("");
            };

            const removeProperty = (index: number) => {
              setProperties(properties.filter((_, i) => i !== index));
            };
            return (
              <div>
                <label>Custom Properties</label>
                <div>
                  {/*Existing properties*/}
                  {properties.map((property, index) => (
                    <div key={index}>
                      <div>
                        <span>{property.label}</span>
                        <button
                          type="button"
                          onClick={() => removeProperty(index)}
                        >
                          <X />
                        </button>
                      </div>
                      {/*Add values to existing properties*/}
                      <div>
                        <input
                          type="text"
                          placeholder="Enter value"
                          value={newValue}
                          onChange={(e) => setNewValue(e.target.value)}
                        />
                        <button type="button" onClick={() => addValue(index)}>
                          Add
                        </button>
                      </div>

                      {/*Show values*/}
                      <div>
                        {property.values.map((val, i) => (
                          <span key={i}>{val}</span>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/*Add new property*/}
                  <div>
                    <Input
                      placeholder="Enter property label"
                      value={newLabel}
                      onChange={(e: any) => setNewLabel(e.target.value)}
                    />
                    <button type="button" onClick={addProperty}>
                      <PlusCircleIcon />
                      Add{" "}
                    </button>
                  </div>
                </div>

                {errors.customProperties && (
                  <p className="text-red-500 text-sm">
                    {errors.customProperties.message as string}
                  </p>
                )}
              </div>
            );
          }}
        />
      </div>
    </div>
  );
};

export default CustomProperties;
