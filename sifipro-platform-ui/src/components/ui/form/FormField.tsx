import type { ReactNode } from "react";
import { FormError } from "./FormError";
import { FormHint } from "./FormHint";
import { FormLabel } from "./FormLabel";
import { mergeClassNames } from "./form-control-styles";

type FormFieldProps = {
  label?: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string;
  className?: string;
  labelClassName?: string;
  children: ReactNode;
};

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  className,
  labelClassName,
  children,
}: FormFieldProps) {
  return (
    <div className={mergeClassNames("space-y-1.5", className)}>
      {label ? (
        <FormLabel htmlFor={htmlFor} className={labelClassName}>
          {label}
        </FormLabel>
      ) : null}

      {children}

      {error ? (
        <FormError>{error}</FormError>
      ) : hint ? (
        <FormHint>{hint}</FormHint>
      ) : null}
    </div>
  );
}
