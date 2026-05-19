import { useEffect, useId, useState } from "react";
import { FormField, TextInput } from "../../../components/ui/form";
import type { UpdateUserPasswordRequest, UserResponse } from "../users.types";

type PasswordUpdateModalProps = {
  open: boolean;
  user: UserResponse | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (payload: UpdateUserPasswordRequest) => Promise<void>;
};

type FormErrors = {
  password?: string;
  confirmPassword?: string;
};

function getDisplayName(user: UserResponse): string {
  return `${user.firstName} ${user.lastName}`;
}

export function PasswordUpdateModal({
  open,
  user,
  isSaving,
  onClose,
  onSubmit,
}: PasswordUpdateModalProps) {
  const dialogTitleId = useId();
  const passwordFieldId = useId();
  const confirmPasswordFieldId = useId();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

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

  if (!open || !user) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: FormErrors = {};

    if (!password.trim()) {
      nextErrors.password = "Password is required.";
    }

    if (!confirmPassword.trim()) {
      nextErrors.confirmPassword = "Please confirm the password.";
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    await onSubmit({ password });
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
              Change Password
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Set a new password for {getDisplayName(user)}.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close password change form"
            className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <FormField
            label="New Password"
            htmlFor={passwordFieldId}
            error={errors.password}
          >
            <TextInput
              id={passwordFieldId}
              type="password"
              value={password}
              disabled={isSaving}
              error={Boolean(errors.password)}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrors((current) => ({ ...current, password: undefined }));
              }}
            />
          </FormField>

          <FormField
            label="Confirm Password"
            htmlFor={confirmPasswordFieldId}
            error={errors.confirmPassword}
          >
            <TextInput
              id={confirmPasswordFieldId}
              type="password"
              value={confirmPassword}
              disabled={isSaving}
              error={Boolean(errors.confirmPassword)}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setErrors((current) => ({
                  ...current,
                  confirmPassword: undefined,
                }));
              }}
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
              {isSaving ? "Saving..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
