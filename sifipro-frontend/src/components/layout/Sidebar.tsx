import {
  ArrowLeftRight,
  BarChart3,
  Gift,
  LayoutDashboard,
  Settings2,
  Shield,
  ShoppingBag,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { appNavigation } from "../../app/router/routes";
import { userHasAnyRole } from "../../auth/role-utils";
import { useAuth } from "../../auth/useAuth";

const navIcons: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/customers": Users,
  "/rewards": Gift,
  "/transactions": ArrowLeftRight,
  "/redemptions": ShoppingBag,
  "/reports": BarChart3,
  "/users": Shield,
  "/program-config": Settings2,
};

const baseLinkClass =
  "group flex items-center gap-3 rounded-[0.85rem] px-3.5 py-2.5 text-[0.925rem] font-medium transition-all duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-indigo-500/15";

export function Sidebar() {
  const { user } = useAuth();

  const visibleNavigation = appNavigation.filter((item) =>
    userHasAnyRole(user, item.roles),
  );

  return (
    <aside className="w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-xl transition-all duration-300 dark:border-white/[0.05] dark:bg-slate-950/75 md:w-72 md:border-b-0 md:border-r">
      <div className="flex h-full flex-col">
        {/* Brand header */}
        <div className="border-b border-slate-200/60 px-6 py-6 dark:border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-[1.125rem] w-[1.125rem] items-center justify-center rounded-sm bg-indigo-600 shadow-[0_2px_8px_rgba(79,70,229,0.35)]">
              <Zap className="h-3 w-3 text-white" strokeWidth={3} />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400">
              SIFIPRO
            </p>
          </div>
          <h2 className="mt-4 text-[1.125rem] font-semibold tracking-tight text-slate-800 dark:text-slate-100">
            Tenant Admin
          </h2>
          <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            Multi-tenant operations
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-1">
            {visibleNavigation.map((item) => {
              const Icon = navIcons[item.path];

              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      isActive
                        ? `${baseLinkClass} bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400`
                        : `${baseLinkClass} text-slate-600 hover:bg-slate-50/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900/40 dark:hover:text-slate-200`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {Icon ? (
                          <Icon
                            className={`h-[1.125rem] w-[1.125rem] shrink-0 transition-colors duration-200 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400"}`}
                            strokeWidth={isActive ? 2.5 : 2}
                          />
                        ) : null}
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="hidden border-t border-slate-200/60 px-6 py-5 dark:border-white/[0.05] md:block mt-auto pb-6">
          <p className="text-[10px] font-medium tracking-wide uppercase text-slate-400 dark:text-slate-500">
            Built for elegant operational clarity.
          </p>
        </div>
      </div>
    </aside>
  );
}
