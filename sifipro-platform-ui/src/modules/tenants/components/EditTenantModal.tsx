import { useEffect, useId, useState } from "react";
import { InlineAlert } from "../../../components/ui/InlineAlert";
import { FormField, TextInput } from "../../../components/ui/form";
import type { TenantResponse, UpdateTenantRequest } from "../tenant.types";

type EditTenantModalProps = {
  tenant: TenantResponse;
  isSaving: boolean;
  serverError: string | null;
  onClose: () => void;
  onSubmit: (payload: UpdateTenantRequest) => Promise<void>;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** RF-01 · edit a merchant's name and contact data. Mounted only while open. */
export function EditTenantModal({ tenant, isSaving, serverError, onClose, onSubmit }: EditTenantModalProps) {
  const titleId = useId();
  const nameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const addressId = useId();

  const [name, setName] = useState(tenant.name);
  const [contactEmail, setContactEmail] = useState(tenant.contactEmail ?? "");
  const [contactPhone, setContactPhone] = useState(tenant.contactPhone ?? "");
  const [address, setAddress] = useState(tenant.address ?? "");
  const [errors, setErrors] = useState<{ name?: string; contactEmail?: string }>({});

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, onClose]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: { name?: string; contactEmail?: string } = {};
    if (!name.trim()) next.name = "Tenant name is required.";
    if (contactEmail.trim() && !EMAIL_PATTERN.test(contactEmail.trim())) {
      next.contactEmail = "Contact email must be a valid format.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    await onSubmit({
      name: name.trim(),
      contactEmail: contactEmail.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      address: address.trim() || undefined,
    });
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
              Edit Tenant
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Code / subdomain <span className="font-mono">{tenant.code}</span> cannot be changed.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close edit tenant form"
            className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <FormField label="Tenant Name" htmlFor={nameId} error={errors.name}>
            <TextInput id={nameId} value={name} disabled={isSaving} error={Boolean(errors.name)}
              onChange={(event) => setName(event.target.value)} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Contact Email" htmlFor={emailId} error={errors.contactEmail}>
              <TextInput id={emailId} type="email" value={contactEmail} disabled={isSaving}
                error={Boolean(errors.contactEmail)} onChange={(event) => setContactEmail(event.target.value)} />
            </FormField>
            <FormField label="Contact Phone" htmlFor={phoneId}>
              <TextInput id={phoneId} type="tel" value={contactPhone} disabled={isSaving}
                onChange={(event) => setContactPhone(event.target.value)} />
            </FormField>
          </div>
          <FormField label="Address" htmlFor={addressId}>
            <TextInput id={addressId} value={address} disabled={isSaving}
              onChange={(event) => setAddress(event.target.value)} />
          </FormField>

          {serverError ? <InlineAlert tone="error" message={serverError} /> : null}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
