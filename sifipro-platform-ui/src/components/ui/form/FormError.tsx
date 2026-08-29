import type { HTMLAttributes } from "react";
import { mergeClassNames } from "./form-control-styles";

type FormErrorProps = HTMLAttributes<HTMLParagraphElement>;

export function FormError({ className, ...props }: FormErrorProps) {
  return (
    <p
      role="alert"
      className={mergeClassNames(
        "text-xs font-medium text-rose-600 dark:text-rose-400",
        className,
      )}
      {...props}
    />
  );
}
