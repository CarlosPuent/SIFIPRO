import { Moon, Sun } from "lucide-react";
import type { Theme } from "../../lib/theme";

type ThemeToggleProps = {
  theme: Theme;
  onToggle: () => void;
};

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white/80 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-900"
      aria-label="Toggle application theme"
      title="Toggle theme"
    >
      {isDark ? (
        <Sun className="h-3.5 w-3.5" strokeWidth={2} />
      ) : (
        <Moon className="h-3.5 w-3.5" strokeWidth={2} />
      )}
      <span>{isDark ? "Light" : "Dark"} mode</span>
    </button>
  );
}
