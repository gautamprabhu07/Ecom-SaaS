// Path: packages/components/size-selector/index.tsx
import { Controller } from "react-hook-form";

const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

const SizeSelector = ({ control, errors }: any) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Sizes
      </label>
      <Controller
        name="sizes"
        control={control}
        render={({ field }) => (
          <div className="flex gap-2 flex-wrap">
            {sizes.map((size) => {
              const isSelected = (field.value || []).includes(size);
              return (
                <button
                  type="button"
                  key={size}
                  onClick={() => {
                    field.onChange(
                      isSelected
                        ? field.value.filter((s: string) => s !== size)
                        : [...(field.value || []), size],
                    );
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${isSelected ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"}`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        )}
      />
      {errors.sizes && (
        <p className="text-red-500 text-xs mt-1">{errors.sizes.message}</p>
      )}
    </div>
  );
};

export default SizeSelector;
