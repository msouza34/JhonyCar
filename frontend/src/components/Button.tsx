import { ButtonHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const styles: Record<Variant, string> = {
  primary:
    "border border-blue-400/25 bg-gradient-to-r from-blue-600/90 to-blue-500/90 text-white shadow-[0_8px_20px_rgba(37,99,235,0.38)] hover:from-blue-500 hover:to-blue-400 disabled:opacity-60 disabled:shadow-none",
  secondary:
    "border border-slate-500/40 bg-[#0f2142]/85 text-slate-100 hover:border-blue-300/35 hover:bg-[#14305f] disabled:opacity-60",
  danger: "border border-rose-400/30 bg-rose-500/90 text-white hover:bg-rose-500 disabled:opacity-60",
  ghost: "border border-white/10 bg-transparent text-slate-200 hover:border-white/20 hover:bg-white/5",
};

export default function Button({
  className,
  variant = "primary",
  loading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-[13px] font-semibold tracking-wide transition-all duration-200",
        styles[variant],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Processando..." : children}
    </button>
  );
}
