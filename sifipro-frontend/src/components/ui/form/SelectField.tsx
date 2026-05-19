import { forwardRef, type SelectHTMLAttributes } from "react";
import {
  getFormControlClassName,
  mergeClassNames,
} from "./form-control-styles";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  error?: boolean;
  wrapperClassName?: string;
};

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ className, error, wrapperClassName, children, ...props }, ref) => {
    return (
      <div className={mergeClassNames("relative group", wrapperClassName)}>
        <select
          ref={ref}
          className={getFormControlClassName({
            error,
            className: mergeClassNames(
              "appearance-none pr-10 cursor-pointer font-medium text-slate-800 dark:text-slate-200",
              className,
            ),
          })}
          {...props}
        >
          {children}
        </select>

        <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-400 group-hover:text-indigo-500 transition-colors duration-200 dark:text-slate-500 dark:group-hover:text-indigo-400">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-[14px] w-[14px] opacity-80"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>
    );
  },
);

SelectField.displayName = "SelectField";

export type { SelectFieldProps };
