import { useEffect, useId, useMemo, useState } from "react";
import {
  DateField,
  FormField,
  SelectField,
  TextArea,
} from "../../../components/ui/form";
import {
  getTodayDateInputValue,
  toLocalDateTimePayload,
} from "../../../lib/date-utils";
import { formatPoints } from "../../../lib/formatters";
import type {
  CreateRedemptionRequest,
  CustomerResponse,
  RedemptionFormValues,
  RewardResponse,
} from "../redemptions.types";

type RedemptionFormModalProps = {
  customers: CustomerResponse[];
  rewards: RewardResponse[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateRedemptionRequest) => Promise<void>;
};

type FormErrors = {
  customerId?: string;
  rewardId?: string;
  redemptionDate?: string;
};

function getInitialFormValues(
  customers: CustomerResponse[],
  rewards: RewardResponse[],
): RedemptionFormValues {
  const defaultCustomer =
    customers.find((customer) => customer.active) ?? customers[0] ?? null;
  const defaultReward =
    rewards.find((reward) => reward.active) ?? rewards[0] ?? null;

  return {
    customerId: defaultCustomer ? String(defaultCustomer.id) : "",
    rewardId: defaultReward ? String(defaultReward.id) : "",
    redemptionDate: getTodayDateInputValue(),
    notes: "",
  };
}

function validate(values: RedemptionFormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.customerId.trim()) {
    errors.customerId = "Customer is required.";
  }

  if (!values.rewardId.trim()) {
    errors.rewardId = "Reward is required.";
  }

  if (!values.redemptionDate.trim()) {
    errors.redemptionDate = "Redemption date is required.";
  }

  return errors;
}

function getCustomerLabel(customer: CustomerResponse): string {
  return `${customer.firstName} ${customer.lastName} (${customer.email})`;
}

export function RedemptionFormModal({
  customers,
  rewards,
  isSaving,
  onClose,
  onSubmit,
}: RedemptionFormModalProps) {
  const dialogTitleId = useId();
  const customerIdFieldId = useId();
  const rewardIdFieldId = useId();
  const redemptionDateFieldId = useId();
  const notesFieldId = useId();

  const [values, setValues] = useState<RedemptionFormValues>(() =>
    getInitialFormValues(customers, rewards),
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const hasCustomers = customers.length > 0;
  const activeRewards = useMemo(
    () => rewards.filter((reward) => reward.active),
    [rewards],
  );
  const selectableRewards = activeRewards.length > 0 ? activeRewards : rewards;
  const hasRewards = selectableRewards.length > 0;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSaving, onClose]);

  const selectedReward = useMemo(() => {
    const rewardId = Number(values.rewardId);
    if (!Number.isFinite(rewardId)) {
      return null;
    }

    return rewards.find((reward) => reward.id === rewardId) ?? null;
  }, [values.rewardId, rewards]);

  const handleInputChange = (
    field: keyof RedemptionFormValues,
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

    const payload: CreateRedemptionRequest = {
      customerId: Number(values.customerId),
      rewardId: Number(values.rewardId),
      redemptionDate: toLocalDateTimePayload(values.redemptionDate),
      notes: values.notes.trim() || undefined,
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
              New Redemption
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Register a reward redemption for the selected program.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close redemption form"
            className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        {!hasCustomers || !hasRewards ? (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
            {!hasCustomers
              ? "No customers available yet. Create a customer before registering redemptions."
              : "No rewards available yet for the selected program. Create an active reward before registering redemptions."}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <FormField
              label="Customer"
              htmlFor={customerIdFieldId}
              error={errors.customerId}
            >
              <SelectField
                id={customerIdFieldId}
                value={values.customerId}
                disabled={isSaving}
                error={Boolean(errors.customerId)}
                onChange={(event) =>
                  handleInputChange("customerId", event.target.value)
                }
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {getCustomerLabel(customer)}
                  </option>
                ))}
              </SelectField>
            </FormField>

            <FormField
              label="Reward"
              htmlFor={rewardIdFieldId}
              error={errors.rewardId}
            >
              <SelectField
                id={rewardIdFieldId}
                value={values.rewardId}
                disabled={isSaving}
                error={Boolean(errors.rewardId)}
                onChange={(event) =>
                  handleInputChange("rewardId", event.target.value)
                }
              >
                <option value="">Select reward</option>
                {selectableRewards.map((reward) => (
                  <option key={reward.id} value={reward.id}>
                    {reward.name}
                  </option>
                ))}
              </SelectField>
            </FormField>

            {selectedReward ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900/70">
                <p className="text-slate-700 dark:text-slate-200">
                  <span className="font-medium">Program:</span>{" "}
                  {selectedReward.programName ??
                    `Program #${selectedReward.programConfigId}`}
                </p>
                <p className="mt-1 text-slate-700 dark:text-slate-200">
                  <span className="font-medium">Required Points:</span>{" "}
                  {formatPoints(selectedReward.requiredPoints)}
                </p>
                <p className="mt-1 text-slate-700 dark:text-slate-200">
                  <span className="font-medium">Stock:</span>{" "}
                  {selectedReward.stock}
                </p>
                <p className="mt-1 text-slate-700 dark:text-slate-200">
                  <span className="font-medium">Active:</span>{" "}
                  {selectedReward.active ? "Yes" : "No"}
                </p>
              </div>
            ) : null}

            <FormField
              label="Redemption Date"
              htmlFor={redemptionDateFieldId}
              error={errors.redemptionDate}
            >
              <DateField
                id={redemptionDateFieldId}
                value={values.redemptionDate}
                disabled={isSaving}
                error={Boolean(errors.redemptionDate)}
                onChange={(event) =>
                  handleInputChange("redemptionDate", event.target.value)
                }
              />
            </FormField>

            <FormField label="Notes" htmlFor={notesFieldId}>
              <TextArea
                id={notesFieldId}
                value={values.notes}
                disabled={isSaving}
                onChange={(event) =>
                  handleInputChange("notes", event.target.value)
                }
                rows={3}
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
                disabled={isSaving || !hasCustomers || !hasRewards}
                className="rounded-lg border border-slate-300 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:border-slate-400 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-100 dark:text-slate-900 dark:hover:border-slate-500 dark:hover:bg-white"
              >
                {isSaving ? "Saving..." : "Create Redemption"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
