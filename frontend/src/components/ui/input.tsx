import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <label className="flex flex-col gap-2 text-sm font-medium text-[#2B3674]">
        <span>{label}</span>
        <input
          ref={ref}
          className={`h-12 rounded-2xl border border-[#E9EDF7] bg-[#FDFDFF] px-4 text-sm text-[#1B2559] outline-none ring-0 transition placeholder:text-[#A3AED0] focus:border-[#4318FF] focus:bg-white ${className}`}
          {...props}
        />
        {error ? <span className="text-xs font-medium text-rose-600">{error}</span> : null}
      </label>
    );
  }
);

Input.displayName = "Input";
