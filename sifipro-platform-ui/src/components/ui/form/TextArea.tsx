import { forwardRef, type TextareaHTMLAttributes } from "react";
import { getFormControlClassName } from "./form-control-styles";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: boolean;
};

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, error, rows = 3, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={getFormControlClassName({
          error,
          className: `resize-none ${className ?? ""}`.trim(),
        })}
        {...props}
      />
    );
  },
);

TextArea.displayName = "TextArea";

export type { TextAreaProps };
