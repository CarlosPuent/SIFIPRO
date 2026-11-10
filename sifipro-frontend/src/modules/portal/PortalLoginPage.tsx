import { Gift, Store, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { FormField, TextInput } from "../../components/ui/form";
import { extractErrorMessage } from "../../lib/error-utils";
import { currentTenantCode } from "../../lib/tenant-subdomain";
import { getPortalToken, getPublicTenant, portalLogin } from "./portal.service";
import type { PublicTenant } from "./portal.types";

/**
 * Customer portal sign-in (RF-08). On a merchant subdomain (e.g. demo.localhost:5173)
 * the merchant is fixed by the URL; without one, the customer types the merchant code.
 */
export function PortalLoginPage() {
  const navigate = useNavigate();
  const subdomainCode = currentTenantCode();

  const [tenantCode, setTenantCode] = useState(subdomainCode ?? "");
  const [tenant, setTenant] = useState<PublicTenant | null>(null);
  const [tenantError, setTenantError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (getPortalToken()) {
      navigate("/portal", { replace: true });
    }
  }, [navigate]);

  // Brand the screen with the merchant resolved from the subdomain.
  useEffect(() => {
    if (!subdomainCode) return;
    let isActive = true;
    getPublicTenant(subdomainCode)
      .then((result) => {
        if (isActive) setTenant(result);
      })
      .catch(() => {
        if (isActive) setTenantError(`No merchant is registered at "${subdomainCode}".`);
      });
    return () => {
      isActive = false;
    };
  }, [subdomainCode]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await portalLogin(tenantCode.trim().toLowerCase(), email.trim(), password);
      navigate("/portal", { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, "Could not sign in. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = Boolean(tenantCode.trim() && email.trim() && password && !isSubmitting);

  const merchantName = tenant?.name ?? "your favorite store";

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel: merchant branding (desktop only) ─────── */}
      <aside
        className="relative hidden overflow-hidden bg-slate-950 lg:flex lg:w-115 lg:flex-col xl:w-125"
        style={{
          backgroundImage: "radial-gradient(rgba(99,102,241,0.1) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-120 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(99,102,241,0.18),transparent)]" />
        <div className="relative z-10 flex h-full flex-col px-10 py-12">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/25">
              <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">SIFIPRO · Rewards</span>
          </div>

          <div className="my-auto py-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">{tenant ? "Loyalty program" : "Customer portal"}</p>
            <h2 className="mt-3 text-[2.4rem] font-bold leading-[1.15] tracking-tight text-white">
              Your points at<br />{merchantName}.
            </h2>
            <p className="mt-5 max-w-xs text-base leading-relaxed text-slate-400">
              Check your balance, your membership tier and the rewards you can claim on your next visit.
            </p>
          </div>

          <div className="space-y-3 border-t border-slate-800/80 pt-8">
            {["Real-time points balance", "Rewards ready to claim", "Your complete points history"].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                <span className="text-sm text-slate-400">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Right panel: form ───────────────────────────────── */}
      <div className="relative flex flex-1 flex-col bg-white dark:bg-[#0d1118]">
        <div className="flex flex-1 items-center justify-center px-6 py-16">
          <div className="w-full max-w-[400px]">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600">
                <Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">SIFIPRO · Rewards</span>
            </div>

            {tenant ? (
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 dark:border-indigo-900/60 dark:bg-indigo-950/40">
                <Store className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                <div>
                  <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">{tenant.name}</p>
                  <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80">{tenant.code}.sifipro · loyalty program</p>
                </div>
              </div>
            ) : null}

            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Check your points</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Sign in with the email you registered at the store and the password they gave you.
            </p>
              {tenantError ? (
                <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-300">
                  {tenantError}
                </p>
              ) : null}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {!subdomainCode ? (
                  <FormField label="Store code" htmlFor="portal-tenant" hint="Ask the store, e.g. demo or cafe-norte.">
                    <TextInput
                      id="portal-tenant"
                      value={tenantCode}
                      onChange={(e) => setTenantCode(e.target.value)}
                      placeholder="demo"
                      autoComplete="organization"
                      disabled={isSubmitting}
                      required
                    />
                  </FormField>
                ) : null}
                <FormField label="Email" htmlFor="portal-email">
                  <TextInput
                    id="portal-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    autoComplete="email"
                    disabled={isSubmitting}
                    required
                  />
                </FormField>
                <FormField label="Password" htmlFor="portal-password">
                  <TextInput
                    id="portal-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your portal password"
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    required
                  />
                </FormField>

                {error ? (
                  <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm dark:border-rose-800/60 dark:bg-rose-950/30">
                    <p className="font-semibold text-rose-700 dark:text-rose-300">Sign-in failed</p>
                    <p className="mt-0.5 text-xs text-rose-600 dark:text-rose-400">{error}</p>
                  </div>
                ) : null}

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                  loadingText="Signing in…"
                  disabled={!canSubmit}
                  className="w-full justify-center"
                  leftIcon={<Gift className="h-4 w-4" />}
                >
                  View my rewards
                </Button>
              </form>

            <div className="mt-8 border-t border-slate-200/80 pt-6 text-center text-xs text-slate-500 dark:border-slate-800/80">
              Store staff?{" "}
              <Link to="/login" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                Sign in to the management panel
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
