import type { LabelHTMLAttributes } from "react";
import { mergeClassNames } from "./form-control-styles";

type FormLabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function FormLabel({ className, ...props }: FormLabelProps) {
  return (
    <label
      className={mergeClassNames(
        "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400",
        className,
      )}
      {...props}
    />
  );
}
