import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "../../../components/ui/Button";
import { FormField, TextInput } from "../../../components/ui/form";
import { apiClient } from "../../../lib/api-client";
import { extractErrorMessage } from "../../../lib/error-utils";
import { tenantSubdomainUrl } from "../../../lib/tenant-subdomain";

type PortalAccessModalProps = {
  customerId: number;
  customerName: string;
  customerEmail: string;
  tenantCode: string;
  portalEnabled: boolean;
  onClose: () => void;
  onChanged: () => void;
};

const PASSWORD_MIN = 8;

/**
 * RF-08 · lets the ADMIN give a customer access to the self-service portal (by setting
 * a password the customer will use) or take it away. Revoking cuts open sessions at once.
 */
export function PortalAccessModal({
  customerId,
  customerName,
  customerEmail,
  tenantCode,
  portalEnabled,
  onClose,
  onChanged,
}: PortalAccessModalProps) {
  const titleId = useId();
  const passwordId = useId();
  const [password, setPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const portalUrl = tenantSubdomainUrl(tenantCode, "/portal/login");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, onClose]);

  const passwordError =
    password.length > 0 && password.length < PASSWORD_MIN
      ? `At least ${PASSWORD_MIN} characters.`
      : undefined;

  const grant = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < PASSWORD_MIN) return;
    setIsSaving(true);
    try {
      await apiClient.put(`/api/customers/${customerId}/portal-access`, { password });
      toast.success(portalEnabled ? "Portal password updated." : `Portal access granted to ${customerName}.`);
      onChanged();
      onClose();
    } catch (error) {
      toast.error(`Could not update portal access. ${extractErrorMessage(error)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const revoke = async () => {
    setIsSaving(true);
    try {
      await apiClient.delete(`/api/customers/${customerId}/portal-access`);
      toast.success(`Portal access revoked for ${customerName}.`);
      onChanged();
      onClose();
    } catch (error) {
      toast.error(`Could not revoke portal access. ${extractErrorMessage(error)}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl dark:border-slate-800/80 dark:bg-slate-950 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Customer portal access
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {customerName} can check their points, tier and rewards online.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close portal access form"
            className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        <div className="mt-5 space-y-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900/70">
          <p className="text-slate-700 dark:text-slate-200">
            <span className="font-medium">Status:</span>{" "}
            {portalEnabled ? (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Enabled</span>
            ) : (
              <span className="font-semibold text-slate-500">Not enabled</span>
            )}
          </p>
          <p className="text-slate-700 dark:text-slate-200">
            <span className="font-medium">Sign-in email:</span> {customerEmail}
          </p>
          <p className="break-all text-slate-700 dark:text-slate-200">
            <span className="font-medium">Portal URL:</span>{" "}
            <a href={portalUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline dark:text-indigo-400">
              {portalUrl}
            </a>
          </p>
        </div>

        <form onSubmit={grant} className="mt-4 space-y-4">
          <FormField
            label={portalEnabled ? "New portal password" : "Portal password"}
            htmlFor={passwordId}
            hint="Share it with the customer in person. It is stored encrypted."
            error={passwordError}
          >
            <TextInput
              id={passwordId}
              type="password"
              value={password}
              autoComplete="new-password"
              disabled={isSaving}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Min. 8 characters"
            />
          </FormField>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {portalEnabled ? (
              <Button type="button" variant="destructive" size="sm" disabled={isSaving} onClick={() => void revoke()}>
                Revoke access
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" variant="primary" isLoading={isSaving} disabled={password.length < PASSWORD_MIN}>
              {portalEnabled ? "Update password" : "Grant access"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
