// Path: packages/components/size-selector/index.tsx
import { Controller } from "react-hook-form";

const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

const SizeSelector = ({ control, errors }: any) => {
  return (
    <div>
      <label className="block text-sm font-medium text-[#292524] mb-2">
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
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 hover:-translate-y-0.5 ${isSelected ? "bg-[#059669] text-white border-[#059669] shadow-[0_4px_14px_-4px_rgba(5,150,105,0.4)]" : "bg-white text-[#78716C] border-[#E7E5E4] hover:border-[#059669]"}`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        )}
      />
      {errors.sizes && (
        <p className="text-red-500 text-xs mt-1 animate-[dropdown-in_150ms_ease-out]">
          {errors.sizes.message}
        </p>
      )}
    </div>
  );
};

export default SizeSelector;
