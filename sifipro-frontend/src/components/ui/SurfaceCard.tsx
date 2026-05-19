import type { ReactNode } from "react";

type SurfaceCardProps = {
  children: ReactNode;
  className?: string;
};

export function SurfaceCard({ children, className }: SurfaceCardProps) {
  const defaultClasses =
    "relative rounded-[1.25rem] border border-slate-200/70 bg-white/95 p-6 shadow-[0_4px_24px_rgba(15,23,42,0.03)] backdrop-blur-md transition-all duration-200 dark:border-white/[0.05] dark:bg-slate-900/90 dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)]";

  return (
    <section className={`${defaultClasses} ${className ?? ""}`.trim()}>
      {children}
    </section>
  );
}
