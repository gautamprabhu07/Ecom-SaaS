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
    <div>
      <label>Custom Specifications</label>
      <div>
        {fields?.map((item, index) => (
          <div key={item.id}>
            <Controller
              name={`custom_specifications.${index}.key`}
              control={control}
              rules={{ required: "Specification name is required" }}
              render={(field) => (
                <Input
                  label="Specification Name"
                  placeholder="Enter specification name"
                  {...field}
                />
              )}
            />
            <Controller
              name={`custom_specifications.${index}.value`}
              control={control}
              rules={{ required: "Specification value is required" }}
              render={(field) => (
                <Input
                  label="Specification Value"
                  placeholder="e.g., 4000mAh, Plastic, 5.5 inches"
                  {...field}
                />
              )}
            />
            <button type="button" onClick={() => remove(index)}>
              <Trash2 />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => append({ name: "", value: "" })}>
          <PlusCircleIcon />
          Add Specification
        </button>
      </div>
      {errors?.custom_specifications && (
        <p className="text-red-500 text-sm">
          {errors.custom_specifications.message as string}
        </p>
      )}
    </div>
  );
};

export default CustomSpecifications;
