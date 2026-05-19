import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md";

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  isLoading?: boolean;
  loadingText?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-indigo-600 text-white shadow-[0_1px_2px_rgba(79,70,229,0.2)] hover:bg-indigo-500 hover:shadow-[0_2px_6px_rgba(79,70,229,0.3)] dark:bg-indigo-600 dark:hover:bg-indigo-500 focus-visible:ring-indigo-500/80 active:scale-[0.98]",
  secondary:
    "border-slate-200 shadow-sm bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-white/[0.08] dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-white/[0.12] dark:hover:bg-slate-800 active:scale-[0.98]",
  ghost:
    "border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-slate-100 active:scale-[0.98]",
  destructive:
    "border-transparent bg-rose-600 text-white shadow-[0_1px_2px_rgba(225,29,72,0.2)] hover:bg-rose-500 hover:shadow-[0_2px_6px_rgba(225,29,72,0.3)] dark:bg-rose-600 dark:hover:bg-rose-500 focus-visible:ring-rose-500/80 active:scale-[0.98]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg",
  md: "gap-2 px-4 py-2.5 text-[0.925rem] font-semibold rounded-[0.85rem]",
};

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function Button({
  variant = "secondary",
  size = "md",
  leftIcon,
  isLoading = false,
  loadingText = "Saving…",
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center border transition-all duration-200 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-indigo-500/15 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50";

  return (
    <button
      disabled={disabled ?? isLoading}
      className={`${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim()}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {leftIcon ? <span className="shrink-0">{leftIcon}</span> : null}
          {children}
        </>
      )}
    </button>
  );
}
