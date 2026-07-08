import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <label className="flex flex-col gap-2 text-sm font-medium text-[#2B3674]">
        <span>{label}</span>
        <textarea
          ref={ref}
          className={`min-h-32 rounded-2xl border border-[#E9EDF7] bg-[#FDFDFF] px-4 py-3 text-sm text-[#1B2559] outline-none ring-0 transition placeholder:text-[#A3AED0] focus:border-[#4318FF] focus:bg-white disabled:border-[#D8DEEE] disabled:bg-[#EEF2F7] disabled:text-[#7B86A8] disabled:placeholder:text-[#AAB4CF] ${className}`}
          {...props}
        />
        {error ? <span className="text-xs font-medium text-rose-600">{error}</span> : null}
      </label>
    );
  }
);

Textarea.displayName = "Textarea";
