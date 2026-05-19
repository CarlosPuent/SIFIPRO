import { LogOut } from "lucide-react";
import { useLocation } from "react-router-dom";
import { appNavigation } from "../../app/router/routes";
import { isAdmin, isStaff } from "../../auth/role-utils";
import { useAuth } from "../../auth/useAuth";
import type { Theme } from "../../lib/theme";
import { Button } from "../ui/Button";
import { ThemeToggle } from "../ui/ThemeToggle";

type AppHeaderProps = {
  theme: Theme;
  onToggleTheme: () => void;
};

export function AppHeader({ theme, onToggleTheme }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const activeItem = appNavigation.find(
    (item) =>
      location.pathname === item.path ||
      location.pathname.startsWith(`${item.path}/`),
  );

  const userDisplayName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : "Authenticated User";

  const roleLabel = isAdmin(user) ? "ADMIN" : isStaff(user) ? "STAFF" : "-";
  const tenantName = user?.tenant.name ?? "-";

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/80 px-5 py-3.5 backdrop-blur-xl transition-all duration-300 dark:border-white/[0.05] dark:bg-slate-950/75 sm:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400">
            SIFIPRO Admin
          </p>
          <h1 className="text-[1.125rem] font-semibold tracking-tight text-slate-800 dark:text-slate-100 sm:text-[1.25rem]">
            {activeItem?.label ?? "SIFIPRO"}
          </h1>
          {activeItem?.description ? (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {activeItem.description}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <div className="hidden items-center gap-3 rounded-full border border-slate-200/70 bg-white/90 py-1.5 pl-1.5 pr-4 shadow-sm dark:border-white/[0.05] dark:bg-slate-900/60 md:flex">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              {userDisplayName.charAt(0).toUpperCase()}
            </span>
            <div className="text-right leading-none">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {userDisplayName}
              </p>
              <p className="mt-1 text-[10px] font-medium tracking-wide text-slate-500 dark:text-slate-400">
                {roleLabel} · {tenantName}
              </p>
            </div>
          </div>

          <ThemeToggle theme={theme} onToggle={onToggleTheme} />

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<LogOut className="h-3.5 w-3.5" />}
            onClick={logout}
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
