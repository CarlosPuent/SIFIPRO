import { useEffect, useId, useMemo, useState } from "react";
import { FormField, TextInput } from "../../../components/ui/form";
import type {
  CreateCustomerRequest,
  CustomerFormValues,
  CustomerResponse,
  UpdateCustomerRequest,
} from "../customers.types";

type CustomerFormMode = "create" | "edit";

type CustomerFormModalProps = {
  open: boolean;
  mode: CustomerFormMode;
  initialCustomer: CustomerResponse | null;
  isSaving: boolean;
  isLoadingInitialData: boolean;
  onClose: () => void;
  onSubmit: (
    payload: CreateCustomerRequest | UpdateCustomerRequest,
  ) => Promise<void>;
};

type FormErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

function getInitialFormValues(
  customer: CustomerResponse | null,
): CustomerFormValues {
  if (!customer) {
    return {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    };
  }

  return {
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone ?? "",
  };
}

function validate(values: CustomerFormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.firstName.trim()) {
    errors.firstName = "First name is required.";
  }

  if (!values.lastName.trim()) {
    errors.lastName = "Last name is required.";
  }

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  }

  return errors;
}

export function CustomerFormModal({
  open,
  mode,
  initialCustomer,
  isSaving,
  isLoadingInitialData,
  onClose,
  onSubmit,
}: CustomerFormModalProps) {
  const dialogTitleId = useId();
  const firstNameFieldId = useId();
  const lastNameFieldId = useId();
  const emailFieldId = useId();
  const phoneFieldId = useId();

  const [values, setValues] = useState<CustomerFormValues>(() =>
    getInitialFormValues(initialCustomer),
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const title = useMemo(
    () => (mode === "create" ? "New Customer" : "Edit Customer"),
    [mode],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(getInitialFormValues(initialCustomer));
    setErrors({});
  }, [open, mode, initialCustomer]);

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

  const handleInputChange = (
    field: keyof CustomerFormValues,
    value: string,
  ) => {
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

    const payload = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim() || undefined,
    };

    await onSubmit(payload);
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
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {mode === "create"
                ? "Create a new customer profile."
                : "Update customer information."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close customer form"
            className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        {isLoadingInitialData ? (
          <div className="mt-5 space-y-3">
            <div className="h-10 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-10 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-10 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-10 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <FormField
              label="First Name"
              htmlFor={firstNameFieldId}
              error={errors.firstName}
            >
              <TextInput
                id={firstNameFieldId}
                type="text"
                value={values.firstName}
                disabled={isSaving}
                error={Boolean(errors.firstName)}
                onChange={(event) =>
                  handleInputChange("firstName", event.target.value)
                }
              />
            </FormField>

            <FormField
              label="Last Name"
              htmlFor={lastNameFieldId}
              error={errors.lastName}
            >
              <TextInput
                id={lastNameFieldId}
                type="text"
                value={values.lastName}
                disabled={isSaving}
                error={Boolean(errors.lastName)}
                onChange={(event) =>
                  handleInputChange("lastName", event.target.value)
                }
              />
            </FormField>

            <FormField
              label="Email"
              htmlFor={emailFieldId}
              error={errors.email}
            >
              <TextInput
                id={emailFieldId}
                type="email"
                value={values.email}
                disabled={isSaving}
                error={Boolean(errors.email)}
                onChange={(event) =>
                  handleInputChange("email", event.target.value)
                }
              />
            </FormField>

            <FormField label="Phone" htmlFor={phoneFieldId}>
              <TextInput
                id={phoneFieldId}
                type="text"
                value={values.phone}
                disabled={isSaving}
                onChange={(event) =>
                  handleInputChange("phone", event.target.value)
                }
                placeholder="Optional"
              />
            </FormField>

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
                {isSaving
                  ? "Saving..."
                  : mode === "create"
                    ? "Create Customer"
                    : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
