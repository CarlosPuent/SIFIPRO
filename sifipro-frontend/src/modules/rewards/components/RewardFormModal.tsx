import { useEffect, useId, useMemo, useState } from "react";
import { FormField, TextArea, TextInput } from "../../../components/ui/form";
import type {
  RewardFormSubmitPayload,
  RewardFormValues,
  RewardResponse,
} from "../rewards.types";

type RewardFormMode = "create" | "edit";

type RewardFormModalProps = {
  open: boolean;
  mode: RewardFormMode;
  initialReward: RewardResponse | null;
  isSaving: boolean;
  isLoadingInitialData: boolean;
  onClose: () => void;
  onSubmit: (payload: RewardFormSubmitPayload) => Promise<void>;
};

type FormErrors = {
  name?: string;
  requiredPoints?: string;
  stock?: string;
};

function getInitialFormValues(reward: RewardResponse | null): RewardFormValues {
  if (!reward) {
    return {
      name: "",
      description: "",
      requiredPoints: "",
      stock: "0",
    };
  }

  return {
    name: reward.name,
    description: reward.description ?? "",
    requiredPoints: String(reward.requiredPoints),
    stock: String(reward.stock),
  };
}

function validate(values: RewardFormValues): FormErrors {
  const errors: FormErrors = {};
  const requiredPoints = Number(values.requiredPoints);
  const stock = Number(values.stock);

  if (!values.name.trim()) {
    errors.name = "Name is required.";
  }

  if (!values.requiredPoints.trim()) {
    errors.requiredPoints = "Required points is required.";
  } else if (!Number.isFinite(requiredPoints) || requiredPoints <= 0) {
    errors.requiredPoints = "Required points must be a positive number.";
  }

  if (!values.stock.trim()) {
    errors.stock = "Stock is required.";
  } else if (!Number.isFinite(stock) || stock < 0) {
    errors.stock = "Stock must be zero or a positive number.";
  }

  return errors;
}

export function RewardFormModal({
  open,
  mode,
  initialReward,
  isSaving,
  isLoadingInitialData,
  onClose,
  onSubmit,
}: RewardFormModalProps) {
  const dialogTitleId = useId();
  const nameFieldId = useId();
  const descriptionFieldId = useId();
  const requiredPointsFieldId = useId();
  const stockFieldId = useId();

  const [values, setValues] = useState<RewardFormValues>(() =>
    getInitialFormValues(initialReward),
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const title = useMemo(
    () => (mode === "create" ? "New Reward" : "Edit Reward"),
    [mode],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(getInitialFormValues(initialReward));
    setErrors({});
  }, [open, mode, initialReward]);

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

  const handleInputChange = (field: keyof RewardFormValues, value: string) => {
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

    const payload: RewardFormSubmitPayload = {
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      requiredPoints: Number(values.requiredPoints),
      stock: Number(values.stock),
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
                ? "Create a new reward configuration."
                : "Update reward details and availability."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close reward form"
            className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        {isLoadingInitialData ? (
          <div className="mt-5 space-y-3">
            <div className="h-10 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-20 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-10 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-10 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <FormField label="Name" htmlFor={nameFieldId} error={errors.name}>
              <TextInput
                id={nameFieldId}
                type="text"
                value={values.name}
                disabled={isSaving}
                error={Boolean(errors.name)}
                onChange={(event) =>
                  handleInputChange("name", event.target.value)
                }
              />
            </FormField>

            <FormField label="Description" htmlFor={descriptionFieldId}>
              <TextArea
                id={descriptionFieldId}
                value={values.description}
                disabled={isSaving}
                onChange={(event) =>
                  handleInputChange("description", event.target.value)
                }
                rows={3}
                placeholder="Optional"
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                label="Required Points"
                htmlFor={requiredPointsFieldId}
                error={errors.requiredPoints}
              >
                <TextInput
                  id={requiredPointsFieldId}
                  type="number"
                  min="1"
                  step="1"
                  value={values.requiredPoints}
                  disabled={isSaving}
                  error={Boolean(errors.requiredPoints)}
                  onChange={(event) =>
                    handleInputChange("requiredPoints", event.target.value)
                  }
                />
              </FormField>

              <FormField
                label="Stock"
                htmlFor={stockFieldId}
                error={errors.stock}
              >
                <TextInput
                  id={stockFieldId}
                  type="number"
                  min="0"
                  step="1"
                  value={values.stock}
                  disabled={isSaving}
                  error={Boolean(errors.stock)}
                  onChange={(event) =>
                    handleInputChange("stock", event.target.value)
                  }
                />
              </FormField>
            </div>

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
                    ? "Create Reward"
                    : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
