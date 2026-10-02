import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { FormField, SelectField, TextArea, TextInput } from "../../../components/ui/form";
import { extractErrorMessage } from "../../../lib/error-utils";
import { formatPoints } from "../../../lib/formatters";
import { adjustCustomerPoints } from "../../audit/audit.service";
import type { ProgramConfigResponse } from "../../program-config/program-config.types";
import { getCustomerProgramBalance } from "../../redemptions/redemptions.service";

type AdjustPointsModalProps = {
  customerId: number;
  customerName: string;
  globalBalance: number;
  programs: ProgramConfigResponse[];
  defaultProgramId: number | null;
  onClose: () => void;
  onAdjusted: () => void;
};

type FormErrors = {
  points?: string;
  reason?: string;
};

type BalanceState = {
  programId: number;
  value: number | null;
  error: string | null;
};

const REASON_MIN = 5;
const REASON_MAX = 255;

// Mounted only while open, so every opening starts from a clean form.
export function AdjustPointsModal({
  customerId,
  customerName,
  globalBalance,
  programs,
  defaultProgramId,
  onClose,
  onAdjusted,
}: AdjustPointsModalProps) {
  const titleId = useId();
  const programFieldId = useId();
  const pointsFieldId = useId();
  const reasonFieldId = useId();

  const [programId, setProgramId] = useState<number | null>(
    defaultProgramId ?? programs[0]?.id ?? null,
  );
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [balance, setBalance] = useState<BalanceState | null>(null);

  // Balance in the selected program: the same value the backend validates against.
  useEffect(() => {
    if (programId === null) return;
    let isActive = true;
    getCustomerProgramBalance(customerId, programId)
      .then((result) => {
        if (isActive) setBalance({ programId, value: Number(result.availablePoints), error: null });
      })
      .catch((error: unknown) => {
        if (isActive) {
          setBalance({ programId, value: null, error: extractErrorMessage(error, "Could not load the balance.") });
        }
      });
    return () => {
      isActive = false;
    };
  }, [customerId, programId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, onClose]);

  const currentBalance = balance?.programId === programId ? balance : null;
  const isBalanceLoading = programId !== null && currentBalance === null;
  const pointsValue = Number(points);
  const hasValidPoints = points.trim() !== "" && Number.isFinite(pointsValue) && pointsValue !== 0;
  const newProgramBalance =
    hasValidPoints && currentBalance?.value != null ? currentBalance.value + pointsValue : null;
  const newGlobalBalance = hasValidPoints ? Number(globalBalance) + pointsValue : null;
  const wouldGoNegative =
    (newProgramBalance !== null && newProgramBalance < 0) ||
    (newGlobalBalance !== null && newGlobalBalance < 0);

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!hasValidPoints) {
      next.points = "Enter a positive or negative number different from zero.";
    }
    const trimmedReason = reason.trim();
    if (trimmedReason.length < REASON_MIN) {
      next.reason = `The reason must have at least ${REASON_MIN} characters.`;
    } else if (trimmedReason.length > REASON_MAX) {
      next.reason = `The reason must not exceed ${REASON_MAX} characters.`;
    }
    return next;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || programId === null || wouldGoNegative) {
      return;
    }

    setIsSaving(true);
    try {
      const result = await adjustCustomerPoints(customerId, {
        programConfigId: programId,
        points: pointsValue,
        reason: reason.trim(),
      });
      toast.success(
        `Points adjusted (${pointsValue > 0 ? "+" : ""}${formatPoints(pointsValue)}). New balance: ${formatPoints(result.pointsBalance)}.`,
      );
      onAdjusted();
      onClose();
    } catch (error) {
      toast.error(`Could not adjust points. ${extractErrorMessage(error)}`);
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
              Adjust points
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manual correction for {customerName}. It is recorded in the audit log with your user and the reason.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close adjust points form"
            className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        {programs.length === 0 ? (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
            This tenant has no programs yet.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <FormField label="Program" htmlFor={programFieldId}>
              <SelectField
                id={programFieldId}
                value={programId ?? ""}
                disabled={isSaving}
                onChange={(event) => setProgramId(Number(event.target.value))}
              >
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.programName}
                  </option>
                ))}
              </SelectField>
            </FormField>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900/70">
              <p className="text-slate-700 dark:text-slate-200">
                <span className="font-medium">Points in this program:</span>{" "}
                {isBalanceLoading
                  ? "Loading..."
                  : currentBalance?.value != null
                    ? formatPoints(currentBalance.value)
                    : "Unavailable"}
                <span className="text-slate-500 dark:text-slate-400">
                  {" "}
                  (global balance: {formatPoints(globalBalance)})
                </span>
              </p>
              {newProgramBalance !== null ? (
                <p className="mt-1 text-slate-700 dark:text-slate-200">
                  <span className="font-medium">After the adjustment:</span> {formatPoints(newProgramBalance)} in
                  this program · {formatPoints(newGlobalBalance ?? 0)} global
                </p>
              ) : null}
              {wouldGoNegative ? (
                <p role="alert" className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400">
                  The adjustment would leave a negative balance.
                </p>
              ) : null}
              {currentBalance?.error ? (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{currentBalance.error}</p>
              ) : null}
            </div>

            <FormField
              label="Points"
              htmlFor={pointsFieldId}
              error={errors.points}
              hint={errors.points ? undefined : "Positive to add, negative to remove (e.g. -20)."}
            >
              <TextInput
                id={pointsFieldId}
                type="number"
                step="any"
                value={points}
                disabled={isSaving}
                error={Boolean(errors.points)}
                placeholder="50"
                onChange={(event) => {
                  setPoints(event.target.value);
                  setErrors((current) => ({ ...current, points: undefined }));
                }}
              />
            </FormField>

            <FormField
              label="Reason"
              htmlFor={reasonFieldId}
              error={errors.reason}
              hint={errors.reason ? undefined : `${reason.trim().length}/${REASON_MAX} characters (minimum ${REASON_MIN}).`}
            >
              <TextArea
                id={reasonFieldId}
                rows={3}
                maxLength={REASON_MAX}
                value={reason}
                disabled={isSaving}
                placeholder="Why are these points being adjusted?"
                onChange={(event) => {
                  setReason(event.target.value);
                  setErrors((current) => ({ ...current, reason: undefined }));
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
                disabled={isSaving || wouldGoNegative || programId === null}
                className="rounded-lg border border-slate-300 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:border-slate-400 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-100 dark:text-slate-900 dark:hover:border-slate-500 dark:hover:bg-white"
              >
                {isSaving ? "Saving..." : "Apply adjustment"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
