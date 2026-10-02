import { useEffect, useState } from "react";

// True while the app is in dark mode (the "dark" class on <html>); updates live when
// the theme toggle changes it. Used to pick chart colors, which can't use Tailwind.
export function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => {
      observer.disconnect();
    };
  }, []);

  return isDark;
}

