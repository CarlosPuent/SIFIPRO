import { SurfaceCard } from "./SurfaceCard";

type ModulePlaceholderProps = {
  title: string;
  description: string;
};

export function ModulePlaceholder({
  title,
  description,
}: ModulePlaceholderProps) {
  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          {title}
        </h1>
        <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
          {description}
        </p>
      </header>

      <SurfaceCard className="p-6 sm:p-8">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Module Placeholder
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
            This area is intentionally kept simple for the MVP stage. Future
            module-specific widgets and API data can be integrated here without
            changing the global layout architecture.
          </p>
        </div>
      </SurfaceCard>
    </section>
  );
}
