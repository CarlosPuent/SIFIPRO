import { forwardRef, type InputHTMLAttributes } from "react";
import { getFormControlClassName } from "./form-control-styles";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
};

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={getFormControlClassName({ error, className })}
        {...props}
      />
    );
  },
);

TextInput.displayName = "TextInput";

export type { TextInputProps };
