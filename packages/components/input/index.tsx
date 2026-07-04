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
      "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
