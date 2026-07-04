// Path: packages/components/custom-specifications/index.tsx
import React from "react";
import { Controller, useFieldArray } from "react-hook-form";
import Input from "../input";
import { PlusCircleIcon, Trash2 } from "lucide-react";

const CustomSpecifications = ({ control, errors }: any) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "custom_specifications",
  });

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Custom Specifications
      </label>

      {fields?.map((item, index) => (
        <div
          key={item.id}
          className="flex gap-2 items-start border border-gray-200 rounded-lg p-3"
        >
          <div className="flex-1">
            <Controller
              name={`custom_specifications.${index}.key`}
              control={control}
              rules={{ required: "Specification name is required" }}
              render={(field) => (
                <Input label="Name" placeholder="e.g., Battery" {...field} />
              )}
            />
          </div>
          <div className="flex-1">
            <Controller
              name={`custom_specifications.${index}.value`}
              control={control}
              rules={{ required: "Specification value is required" }}
              render={(field) => (
                <Input label="Value" placeholder="e.g., 4000mAh" {...field} />
              )}
            />
          </div>
          <button
            type="button"
            onClick={() => remove(index)}
            className="mt-6 p-1.5 text-gray-400 hover:text-red-500 transition shrink-0"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => append({ name: "", value: "" })}
        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition"
      >
        <PlusCircleIcon size={16} /> Add Specification
      </button>

      {errors?.custom_specifications && (
        <p className="text-red-500 text-xs">
          {errors.custom_specifications.message as string}
        </p>
      )}
    </div>
  );
};

export default CustomSpecifications;
