// Path: packages/components/input/index.tsx
import React, { forwardRef } from "react";

interface BaseProps {
  label?: string;
  type?: "text" | "email" | "password" | "number" | "textarea";
  className?: string;
}

type InputProps = BaseProps & React.InputHTMLAttributes<HTMLInputElement>;
type TextAreaProps = BaseProps &
  React.TextareaHTMLAttributes<HTMLTextAreaElement>;
type Props = InputProps | TextAreaProps;

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, Props>(
  ({ label, type = "text", className, ...props }, ref) => {
    const base =
      "w-full border border-[#E7E5E4] rounded-2xl px-3 py-2.5 text-sm text-[#292524] placeholder:text-[#78716C] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669]";
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[#292524] mb-1">
            {label}
          </label>
        )}
        {type === "textarea" ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            className={`${base} resize-none min-h-[100px] ${className}`}
            {...(props as TextAreaProps)}
          />
        ) : (
          <input
            type={type}
            ref={ref as React.Ref<HTMLInputElement>}
            className={`${base} ${className}`}
            {...(props as InputProps)}
          />
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
export default Input;
