import { forwardRef } from "react";
import { mergeClassNames } from "./form-control-styles";
import { TextInput, type TextInputProps } from "./TextInput";

type DateFieldProps = Omit<TextInputProps, "type">;

export const DateField = forwardRef<HTMLInputElement, DateFieldProps>(
  ({ className, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        type="date"
        className={mergeClassNames("ui-date-input", className)}
        {...props}
      />
    );
  },
);

DateField.displayName = "DateField";

export type { DateFieldProps };
