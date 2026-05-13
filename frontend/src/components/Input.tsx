import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <label className="flex w-full flex-col gap-1.5 text-sm text-slate-200">
        {label ? <span className="font-medium tracking-wide text-slate-300">{label}</span> : null}
        <input
          ref={ref}
          className={cn(
            "w-full rounded-xl border border-white/15 bg-[#0c1933]/80 px-3 py-2.5 text-slate-100 outline-none transition",
            "placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30",
            error ? "border-red-400/70 focus:border-red-400 focus:ring-red-500/30" : "",
            className,
          )}
          {...props}
        />
        {error ? <span className="text-xs text-red-300">{error}</span> : null}
      </label>
    );
  },
);

Input.displayName = "Input";

export default Input;
