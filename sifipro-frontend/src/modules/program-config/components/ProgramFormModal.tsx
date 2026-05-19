import { useEffect, useId, useMemo, useState } from "react";
import { FormField, TextInput } from "../../../components/ui/form";
import type {
  CreateProgramConfigRequest,
  ProgramConfigResponse,
  UpdateProgramConfigRequest,
} from "../program-config.types";

type ProgramFormMode = "create" | "edit";

type ProgramFormModalProps = {
  open: boolean;
  mode: ProgramFormMode;
  initialProgram: ProgramConfigResponse | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (
    payload: CreateProgramConfigRequest | UpdateProgramConfigRequest,
  ) => Promise<void>;
};

type ProgramFormValues = {
  programName: string;
  pointsPerDollar: string;
  minimumPurchaseAmount: string;
  active: boolean;
};

type FormErrors = {
  programName?: string;
  pointsPerDollar?: string;
  minimumPurchaseAmount?: string;
};

function getInitialFormValues(
  program: ProgramConfigResponse | null,
): ProgramFormValues {
  if (!program) {
    return {
      programName: "",
      pointsPerDollar: "1",
      minimumPurchaseAmount: "0",
      active: true,
    };
  }

  return {
    programName: program.programName,
    pointsPerDollar: String(program.pointsPerDollar),
    minimumPurchaseAmount: String(program.minimumPurchaseAmount),
    active: program.active,
  };
}

function validate(values: ProgramFormValues): {
  errors: FormErrors;
  payload: CreateProgramConfigRequest | UpdateProgramConfigRequest | null;
} {
  const errors: FormErrors = {};

  const normalizedName = values.programName.trim();
  if (!normalizedName) {
    errors.programName = "Program name is required.";
  }

  const parsedPointsPerDollar = Number(values.pointsPerDollar);
  if (!values.pointsPerDollar.trim()) {
    errors.pointsPerDollar = "Points per dollar is required.";
  } else if (
    !Number.isFinite(parsedPointsPerDollar) ||
    parsedPointsPerDollar <= 0
  ) {
    errors.pointsPerDollar = "Points per dollar must be greater than 0.";
  }

  const parsedMinimumPurchaseAmount = Number(values.minimumPurchaseAmount);
  if (!values.minimumPurchaseAmount.trim()) {
    errors.minimumPurchaseAmount = "Minimum purchase amount is required.";
  } else if (
    !Number.isFinite(parsedMinimumPurchaseAmount) ||
    parsedMinimumPurchaseAmount < 0
  ) {
    errors.minimumPurchaseAmount =
      "Minimum purchase amount must be 0 or greater.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      errors,
      payload: null,
    };
  }

  return {
    errors,
    payload: {
      programName: normalizedName,
      pointsPerDollar: parsedPointsPerDollar,
      minimumPurchaseAmount: parsedMinimumPurchaseAmount,
      active: values.active,
    },
  };
}

export function ProgramFormModal({
  open,
  mode,
  initialProgram,
  isSaving,
  onClose,
  onSubmit,
}: ProgramFormModalProps) {
  const dialogTitleId = useId();
  const programNameFieldId = useId();
  const pointsPerDollarFieldId = useId();
  const minimumPurchaseAmountFieldId = useId();
  const activeFieldId = useId();

  const [values, setValues] = useState<ProgramFormValues>(() =>
    getInitialFormValues(initialProgram),
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const title = useMemo(
    () => (mode === "create" ? "New Program" : "Edit Program"),
    [mode],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(getInitialFormValues(initialProgram));
    setErrors({});
  }, [open, mode, initialProgram]);

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
    field: keyof ProgramFormValues,
    value: string | boolean,
  ) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    if (
      field === "programName" ||
      field === "pointsPerDollar" ||
      field === "minimumPurchaseAmount"
    ) {
      setErrors((current) => ({
        ...current,
        [field]: undefined,
      }));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = validate(values);

    if (!result.payload) {
      setErrors(result.errors);
      return;
    }

    await onSubmit(result.payload);
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
        className="w-full max-w-xl rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl dark:border-slate-800/80 dark:bg-slate-950 sm:p-6"
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
                ? "Create a new tenant program."
                : "Update program details and status."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close program form"
            className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <FormField
            label="Program Name"
            htmlFor={programNameFieldId}
            error={errors.programName}
          >
            <TextInput
              id={programNameFieldId}
              type="text"
              value={values.programName}
              disabled={isSaving}
              error={Boolean(errors.programName)}
              onChange={(event) =>
                handleInputChange("programName", event.target.value)
              }
              placeholder="SIFIPRO Loyalty Program"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Points Per Dollar"
              htmlFor={pointsPerDollarFieldId}
              error={errors.pointsPerDollar}
            >
              <TextInput
                id={pointsPerDollarFieldId}
                type="number"
                inputMode="decimal"
                min={0.01}
                step="0.01"
                value={values.pointsPerDollar}
                disabled={isSaving}
                error={Boolean(errors.pointsPerDollar)}
                onChange={(event) =>
                  handleInputChange("pointsPerDollar", event.target.value)
                }
                placeholder="1"
              />
            </FormField>

            <FormField
              label="Minimum Purchase Amount"
              htmlFor={minimumPurchaseAmountFieldId}
              error={errors.minimumPurchaseAmount}
              hint="Use 0 to allow points on every transaction."
            >
              <TextInput
                id={minimumPurchaseAmountFieldId}
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={values.minimumPurchaseAmount}
                disabled={isSaving}
                error={Boolean(errors.minimumPurchaseAmount)}
                onChange={(event) =>
                  handleInputChange("minimumPurchaseAmount", event.target.value)
                }
                placeholder="0"
              />
            </FormField>
          </div>

          <FormField
            label="Active"
            htmlFor={activeFieldId}
            hint="Inactive programs stop points accrual/redemption logic."
          >
            <label
              htmlFor={activeFieldId}
              className="inline-flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600"
            >
              <input
                id={activeFieldId}
                type="checkbox"
                checked={values.active}
                disabled={isSaving}
                onChange={(event) =>
                  handleInputChange("active", event.target.checked)
                }
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-500"
              />
              <span>
                {values.active ? "Program is active" : "Program is inactive"}
              </span>
            </label>
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
                  ? "Create Program"
                  : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
