import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export const Button = ({ children, className = "", ...props }: ButtonProps) => {
  return (
    <button
      className={`inline-flex h-11 items-center justify-center rounded-full bg-[#4318FF] px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(67,24,255,0.22)] transition hover:bg-[#3311cc] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
