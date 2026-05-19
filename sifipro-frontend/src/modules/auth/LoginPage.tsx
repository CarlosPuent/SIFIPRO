import axios from "axios";
import { Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { defaultRoute } from "../../app/router/routes";
import { useAuth } from "../../auth/useAuth";
import { Button } from "../../components/ui/Button";
import { ThemeToggle } from "../../components/ui/ThemeToggle";
import { FormField, TextInput } from "../../components/ui/form";
import { extractErrorMessage } from "../../lib/error-utils";
import {
  applyTheme,
  getInitialTheme,
  persistTheme,
  type Theme,
} from "../../lib/theme";

const FEATURES = [
  "Multi-program loyalty management",
  "Real-time points & transaction tracking",
  "Redemption history and reward catalog",
];

function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  const iconSize = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const iconInner = size === "sm" ? "h-3.5 w-3.5" : "h-4.5 w-4.5";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex ${iconSize} items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/25`}
      >
        <Zap className={`${iconInner} text-white`} strokeWidth={2.5} />
      </div>
      <span
        className={`${textSize} font-semibold uppercase tracking-[0.2em] text-slate-400`}
      >
        SIFIPRO
      </span>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  const canSubmit = useMemo(
    () => Boolean(email.trim() && password.trim() && !isSubmitting),
    [email, password, isSubmitting],
  );

  const clearError = () => {
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    persistTheme(nextTheme);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login({
        email: email.trim(),
        password,
      });

      navigate(defaultRoute, { replace: true });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setErrorMessage("Invalid email or password.");
        return;
      }

      setErrorMessage(
        extractErrorMessage(error, "Invalid credentials. Please try again."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel: branding (desktop only) ─────── */}
      <aside
        className="relative hidden overflow-hidden bg-slate-950 lg:flex lg:w-115 lg:flex-col xl:w-125"
        style={{
          backgroundImage:
            "radial-gradient(rgba(99,102,241,0.1) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        {/* Indigo glow at top */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-120 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(99,102,241,0.16),transparent)]" />

        <div className="relative z-10 flex h-full flex-col px-10 py-12">
          {/* Logo */}
          <BrandMark />

          {/* Tagline — vertically centered */}
          <div className="my-auto py-10">
            <h2 className="text-[2.6rem] font-bold leading-[1.18] tracking-tight text-white">
              Loyalty operations,<br />elevated.
            </h2>
            <p className="mt-5 max-w-xs text-base leading-relaxed text-slate-400">
              Manage programs, track customer rewards, and drive engagement —
              all from one unified platform.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3 border-t border-slate-800/80 pt-8">
            {FEATURES.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                <span className="text-sm text-slate-400">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Right panel: form ──────────────────────── */}
      <div className="relative flex flex-1 flex-col bg-white dark:bg-[#0d1118]">
        {/* Theme toggle */}
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <ThemeToggle theme={theme} onToggle={handleToggleTheme} />
        </div>

        {/* Form area — vertically and horizontally centered */}
        <div className="flex flex-1 items-center justify-center px-6 py-16">
          <div className="w-full max-w-[384px]">
            {/* Mobile brand mark (hidden on lg+) */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 shadow-md shadow-indigo-500/25">
                <Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                SIFIPRO
              </span>
            </div>

            {/* Heading */}
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Welcome back
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Sign in to your SIFIPRO account to continue.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <FormField label="Email address" htmlFor="login-email">
                <TextInput
                  id="login-email"
                  type="email"
                  value={email}
                  autoComplete="email"
                  disabled={isSubmitting}
                  onChange={(event) => {
                    clearError();
                    setEmail(event.target.value);
                  }}
                  placeholder="you@company.com"
                  required
                />
              </FormField>

              <FormField label="Password" htmlFor="login-password">
                <TextInput
                  id="login-password"
                  type="password"
                  value={password}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  onChange={(event) => {
                    clearError();
                    setPassword(event.target.value);
                  }}
                  placeholder="Enter your password"
                  required
                />
              </FormField>

              {errorMessage ? (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm dark:border-rose-800/60 dark:bg-rose-950/30"
                >
                  <p className="font-semibold text-rose-700 dark:text-rose-300">
                    Sign-in failed
                  </p>
                  <p className="mt-0.5 text-xs text-rose-600 dark:text-rose-400">
                    {errorMessage}
                  </p>
                </div>
              ) : null}

              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                loadingText="Signing in…"
                disabled={!canSubmit}
                size="md"
                className="mt-1 w-full justify-center py-2.5 text-sm"
              >
                Sign in
              </Button>
            </form>

            {/* Bottom divider + footnote */}
            <div className="mt-8 border-t border-slate-200/80 pt-6 dark:border-slate-800/80">
              <p className="text-center text-xs text-slate-400 dark:text-slate-600">
                Tenant-scoped loyalty operations platform
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
