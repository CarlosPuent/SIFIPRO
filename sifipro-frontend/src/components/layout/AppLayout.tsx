import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import { AppHeader } from "./AppHeader";
import { Sidebar } from "./Sidebar";
import {
  applyTheme,
  getInitialTheme,
  persistTheme,
  type Theme,
} from "../../lib/theme";

export function AppLayout() {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
    persistTheme(theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  };

  return (
    <div className="relative min-h-screen text-slate-900 transition-colors dark:text-slate-100">
      <Toaster
        position="bottom-right"
        richColors
        theme={theme}
        closeButton
        toastOptions={{
          style: { fontFamily: "Manrope, sans-serif", fontSize: "13px" },
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#ffffff_0%,#f2f5f9_44%,#edf1f6_100%)] dark:bg-[radial-gradient(circle_at_top,#121720_0%,#0d1118_48%,#0a0e14_100%)]" />
      <div className="relative flex min-h-screen flex-col md:flex-row">
        <Sidebar />

        <div className="flex min-h-screen flex-1 flex-col">
          <AppHeader theme={theme} onToggleTheme={handleToggleTheme} />
          <main className="flex-1 px-4 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-6 lg:px-8 lg:pb-10 lg:pt-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
