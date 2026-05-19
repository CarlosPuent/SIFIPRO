import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { AuthRole } from "../../../auth/auth.types";
import { SurfaceCard } from "../../../components/ui/SurfaceCard";

type DashboardQuickActionsProps = {
  role: AuthRole;
  hasProgramConfigRoute: boolean;
};

type QuickAction = {
  label: string;
  description: string;
  path: string;
};

function buildActions(
  role: AuthRole,
  hasProgramConfigRoute: boolean,
): QuickAction[] {
  if (role === "STAFF") {
    return [
      {
        label: "New Customer",
        description: "Register a customer profile for daily operations.",
        path: "/customers",
      },
      {
        label: "New Transaction",
        description: "Record purchase activity and points issuance.",
        path: "/transactions",
      },
      {
        label: "New Redemption",
        description: "Process reward redemption requests quickly.",
        path: "/redemptions",
      },
    ];
  }

  const adminActions: QuickAction[] = [
    {
      label: "New Customer",
      description: "Create and manage customer profiles.",
      path: "/customers",
    },
    {
      label: "New Reward",
      description: "Add or revise redeemable reward options.",
      path: "/rewards",
    },
    {
      label: "New Transaction",
      description: "Record and supervise operational transactions.",
      path: "/transactions",
    },
    {
      label: "New Redemption",
      description: "Track reward redemption activity.",
      path: "/redemptions",
    },
    {
      label: "Users",
      description: "Manage internal admin and staff accounts.",
      path: "/users",
    },
  ];

  if (hasProgramConfigRoute) {
    adminActions.push({
      label: "Programs",
      description: "Manage program availability and core settings.",
      path: "/program-config",
    });
  }

  return adminActions;
}

export function DashboardQuickActions({
  role,
  hasProgramConfigRoute,
}: DashboardQuickActionsProps) {
  const actions = buildActions(role, hasProgramConfigRoute);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          Quick Actions
        </h2>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Shortcuts for daily operations
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => (
          <SurfaceCard key={action.label} className="group relative overflow-hidden p-0">
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-slate-300/70 to-transparent dark:via-slate-700/80" />
            <Link
              to={action.path}
              className="block rounded-2xl px-4 py-3.5 transition hover:bg-slate-50/80 dark:hover:bg-slate-900/75"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    {action.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {action.description}
                  </p>
                </div>
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-400 transition group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-500 dark:group-hover:border-indigo-800 dark:group-hover:bg-indigo-950/60 dark:group-hover:text-indigo-400">
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          </SurfaceCard>
        ))}
      </div>
    </section>
  );
}
