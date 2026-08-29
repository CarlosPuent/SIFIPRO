import type { HTMLAttributes } from "react";
import { mergeClassNames } from "./form-control-styles";

type FormHintProps = HTMLAttributes<HTMLParagraphElement>;

export function FormHint({ className, ...props }: FormHintProps) {
  return (
    <p
      className={mergeClassNames(
        "text-xs text-slate-500 dark:text-slate-400",
        className,
      )}
      {...props}
    />
  );
}
