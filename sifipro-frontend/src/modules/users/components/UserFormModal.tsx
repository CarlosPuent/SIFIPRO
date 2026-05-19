import { useEffect, useId, useMemo, useState } from "react";
import { FormField, SelectField, TextInput } from "../../../components/ui/form";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserFormValues,
  UserResponse,
} from "../users.types";

type UserFormMode = "create" | "edit";

type UserFormModalProps = {
  open: boolean;
  mode: UserFormMode;
  initialUser: UserResponse | null;
  isSaving: boolean;
  isLoadingInitialData: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateUserRequest | UpdateUserRequest) => Promise<void>;
};

type FormErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: string;
};

function getInitialFormValues(user: UserResponse | null): UserFormValues {
  if (!user) {
    return {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "STAFF",
    };
  }

  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    password: "",
    role: user.role,
  };
}

function validate(values: UserFormValues, mode: UserFormMode): FormErrors {
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

  if (!values.role.trim()) {
    errors.role = "Role is required.";
  }

  if (mode === "create" && !values.password.trim()) {
    errors.password = "Password is required when creating a user.";
  }

  return errors;
}

export function UserFormModal({
  open,
  mode,
  initialUser,
  isSaving,
  isLoadingInitialData,
  onClose,
  onSubmit,
}: UserFormModalProps) {
  const dialogTitleId = useId();
  const firstNameFieldId = useId();
  const lastNameFieldId = useId();
  const emailFieldId = useId();
  const passwordFieldId = useId();
  const roleFieldId = useId();

  const [values, setValues] = useState<UserFormValues>(() =>
    getInitialFormValues(initialUser),
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const title = useMemo(
    () => (mode === "create" ? "New User" : "Edit User"),
    [mode],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(getInitialFormValues(initialUser));
    setErrors({});
  }, [open, mode, initialUser]);

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

  const handleInputChange = (field: keyof UserFormValues, value: string) => {
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

    const nextErrors = validate(values, mode);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (mode === "create") {
      const payload: CreateUserRequest = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        password: values.password,
        role: values.role,
      };

      await onSubmit(payload);
      return;
    }

    const payload: UpdateUserRequest = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      role: values.role,
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
                ? "Create a new internal admin/staff account."
                : "Update internal user details and role."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close user form"
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            </div>

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

            <FormField label="Role" htmlFor={roleFieldId} error={errors.role}>
              <SelectField
                id={roleFieldId}
                value={values.role}
                disabled={isSaving}
                error={Boolean(errors.role)}
                onChange={(event) =>
                  handleInputChange("role", event.target.value)
                }
              >
                <option value="ADMIN">ADMIN</option>
                <option value="STAFF">STAFF</option>
              </SelectField>
            </FormField>

            {mode === "create" ? (
              <FormField
                label="Password"
                htmlFor={passwordFieldId}
                error={errors.password}
              >
                <TextInput
                  id={passwordFieldId}
                  type="password"
                  value={values.password}
                  disabled={isSaving}
                  error={Boolean(errors.password)}
                  onChange={(event) =>
                    handleInputChange("password", event.target.value)
                  }
                />
              </FormField>
            ) : null}

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
                    ? "Create User"
                    : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
