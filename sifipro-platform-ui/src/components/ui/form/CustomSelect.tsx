import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { mergeClassNames } from "./form-control-styles";

type Option = {
  value: string;
  label: string;
};

type CustomSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option...",
  disabled = false,
  className,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={mergeClassNames("relative group", className)}
      ref={containerRef}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={mergeClassNames(
          "flex w-full items-center justify-between rounded-[0.85rem] border bg-white/95 px-3.5 py-2.5 text-[0.925rem] text-slate-900 shadow-[0_2px_8px_rgba(15,23,42,0.04)] outline-none transition-all duration-200 dark:bg-slate-900/80 dark:text-slate-100",
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:border-slate-300 dark:hover:border-slate-600",
          isOpen
            ? "border-indigo-500/80 ring-[3px] ring-indigo-500/15 bg-white dark:border-indigo-400/80 dark:ring-indigo-400/15 dark:bg-slate-900/95"
            : "border-slate-200/90 dark:border-slate-700/80",
        )}
      >
        <span
          className={mergeClassNames(
            "truncate font-medium",
            !selectedOption && "text-slate-400 dark:text-slate-500",
          )}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={mergeClassNames(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            isOpen
              ? "rotate-180 text-indigo-500"
              : "text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-400",
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-[0.85rem] border border-slate-200/80 bg-white/95 py-1.5 shadow-[0_8px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
          <ul className="max-h-60 overflow-auto px-1.5 outline-none select-none">
            {options.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                No options available
              </li>
            ) : (
              options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <li
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={mergeClassNames(
                      "relative flex cursor-pointer items-center rounded-lg py-2 pl-3 pr-9 text-[0.925rem] transition-colors",
                      isSelected
                        ? "bg-indigo-50/80 text-indigo-700 font-semibold dark:bg-indigo-500/15 dark:text-indigo-300"
                        : "text-slate-700 font-medium hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/80 dark:hover:text-slate-100",
                    )}
                  >
                    <span className="block truncate">{option.label}</span>
                    {isSelected && (
                      <span className="absolute inset-y-0 right-3 flex items-center text-indigo-600 dark:text-indigo-400">
                        <Check className="h-4 w-4" strokeWidth={3} />
                      </span>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
