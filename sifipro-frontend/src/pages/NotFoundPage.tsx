import { Link } from "react-router-dom";
import { defaultRoute } from "../app/router/routes";
import { SurfaceCard } from "../components/ui/SurfaceCard";

export function NotFoundPage() {
  return (
    <SurfaceCard className="p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
        The route you requested does not exist yet in this admin foundation.
      </p>
      <Link
        to={defaultRoute}
        className="mt-5 inline-flex rounded-lg border border-slate-300 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:border-slate-400 hover:bg-slate-800 dark:border-slate-600 dark:bg-slate-100 dark:text-slate-900 dark:hover:border-slate-500 dark:hover:bg-white"
      >
        Back to Dashboard
      </Link>
    </SurfaceCard>
  );
}
