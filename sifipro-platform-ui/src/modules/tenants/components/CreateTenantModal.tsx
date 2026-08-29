import { useEffect, useId, useState } from "react";
import { InlineAlert } from "../../../components/ui/InlineAlert";
import { FormField, TextInput } from "../../../components/ui/form";
import type { CreateTenantRequest, TenantFormValues } from "../tenant.types";

type CreateTenantModalProps = {
  open: boolean;
  isSaving: boolean;
  serverError: string | null;
  onClose: () => void;
  onSubmit: (payload: CreateTenantRequest) => Promise<void>;
};

type FormErrors = {
  name?: string;
  code?: string;
  adminFirstName?: string;
  adminLastName?: string;
  adminEmail?: string;
  adminPassword?: string;
};

const EMPTY_VALUES: TenantFormValues = {
  name: "",
  code: "",
  adminFirstName: "",
  adminLastName: "",
  adminEmail: "",
  adminPassword: "",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: TenantFormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Tenant name is required.";
  }

  if (!values.code.trim()) {
    errors.code = "Tenant code is required.";
  }

  if (!values.adminFirstName.trim()) {
    errors.adminFirstName = "Admin first name is required.";
  }

  if (!values.adminLastName.trim()) {
    errors.adminLastName = "Admin last name is required.";
  }

  if (!values.adminEmail.trim()) {
    errors.adminEmail = "Admin email is required.";
  } else if (!EMAIL_PATTERN.test(values.adminEmail.trim())) {
    errors.adminEmail = "Admin email must be a valid format.";
  }

  if (!values.adminPassword) {
    errors.adminPassword = "Admin password is required.";
  } else if (values.adminPassword.length < 8) {
    errors.adminPassword = "Admin password must be at least 8 characters.";
  }

  return errors;
}

export function CreateTenantModal({
  open,
  isSaving,
  serverError,
  onClose,
  onSubmit,
}: CreateTenantModalProps) {
  const dialogTitleId = useId();
  const nameFieldId = useId();
  const codeFieldId = useId();
  const adminFirstNameFieldId = useId();
  const adminLastNameFieldId = useId();
  const adminEmailFieldId = useId();
  const adminPasswordFieldId = useId();

  const [values, setValues] = useState<TenantFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(EMPTY_VALUES);
    setErrors({});
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, isSaving, onClose]);

  if (!open) {
    return null;
  }

  const handleInputChange = (field: keyof TenantFormValues, value: string) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    await onSubmit({
      name: values.name.trim(),
      code: values.code.trim(),
      adminFirstName: values.adminFirstName.trim(),
      adminLastName: values.adminLastName.trim(),
      adminEmail: values.adminEmail.trim(),
      adminPassword: values.adminPassword,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        className="w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl dark:border-slate-800/80 dark:bg-slate-950 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id={dialogTitleId}
              className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100"
            >
              New Tenant
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Creates the tenant and its first ADMIN user.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close tenant form"
            className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <FormField label="Tenant Name" htmlFor={nameFieldId} error={errors.name}>
            <TextInput
              id={nameFieldId}
              type="text"
              value={values.name}
              disabled={isSaving}
              error={Boolean(errors.name)}
              onChange={(event) => handleInputChange("name", event.target.value)}
              placeholder="Acme Retail"
            />
          </FormField>

          <FormField label="Tenant Code" htmlFor={codeFieldId} error={errors.code}>
            <TextInput
              id={codeFieldId}
              type="text"
              value={values.code}
              disabled={isSaving}
              error={Boolean(errors.code)}
              onChange={(event) => handleInputChange("code", event.target.value)}
              placeholder="acme"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Admin First Name"
              htmlFor={adminFirstNameFieldId}
              error={errors.adminFirstName}
            >
              <TextInput
                id={adminFirstNameFieldId}
                type="text"
                value={values.adminFirstName}
                disabled={isSaving}
                error={Boolean(errors.adminFirstName)}
                onChange={(event) =>
                  handleInputChange("adminFirstName", event.target.value)
                }
              />
            </FormField>

            <FormField
              label="Admin Last Name"
              htmlFor={adminLastNameFieldId}
              error={errors.adminLastName}
            >
              <TextInput
                id={adminLastNameFieldId}
                type="text"
                value={values.adminLastName}
                disabled={isSaving}
                error={Boolean(errors.adminLastName)}
                onChange={(event) =>
                  handleInputChange("adminLastName", event.target.value)
                }
              />
            </FormField>
          </div>

          <FormField
            label="Admin Email"
            htmlFor={adminEmailFieldId}
            error={errors.adminEmail}
          >
            <TextInput
              id={adminEmailFieldId}
              type="email"
              value={values.adminEmail}
              disabled={isSaving}
              error={Boolean(errors.adminEmail)}
              onChange={(event) =>
                handleInputChange("adminEmail", event.target.value)
              }
              placeholder="admin@acme.com"
            />
          </FormField>

          <FormField
            label="Admin Password"
            htmlFor={adminPasswordFieldId}
            error={errors.adminPassword}
            hint={
              errors.adminPassword ? undefined : "At least 8 characters."
            }
          >
            <TextInput
              id={adminPasswordFieldId}
              type="password"
              value={values.adminPassword}
              disabled={isSaving}
              error={Boolean(errors.adminPassword)}
              onChange={(event) =>
                handleInputChange("adminPassword", event.target.value)
              }
              autoComplete="new-password"
            />
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
              className="rounded-lg border border-slate-300 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:border-slate-400 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-100 dark:text-slate-900 dark:hover:border-slate-500 dark:hover:bg-white"
            >
              {isSaving ? "Creating..." : "Create Tenant"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
