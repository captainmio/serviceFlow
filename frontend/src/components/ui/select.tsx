import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = "", children, ...props }, ref) => {
    return (
      <label className="flex flex-col gap-2 text-sm font-medium text-[#2B3674]">
        <span>{label}</span>
        <select
          ref={ref}
          className={`h-12 rounded-2xl border border-[#E9EDF7] bg-[#FDFDFF] px-4 text-sm text-[#1B2559] outline-none transition focus:border-[#4318FF] disabled:border-[#D8DEEE] disabled:bg-[#EEF2F7] disabled:text-[#7B86A8] ${className}`}
          {...props}
        >
          {children}
        </select>
        {error ? <span className="text-xs font-medium text-rose-600">{error}</span> : null}
      </label>
    );
  }
);

Select.displayName = "Select";
