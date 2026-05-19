export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'sifipro-theme';

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark';
}

export function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isTheme(storedTheme) ? storedTheme : null;
}

export function getSystemTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getInitialTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.setAttribute('data-theme', theme);
}

export function persistTheme(theme: Theme): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function initializeTheme(): Theme {
  const theme = getInitialTheme();
  applyTheme(theme);
  return theme;
}
