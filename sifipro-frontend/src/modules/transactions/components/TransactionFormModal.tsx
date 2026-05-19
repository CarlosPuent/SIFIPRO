import { useEffect, useId, useState } from "react";
import {
  DateField,
  FormField,
  SelectField,
  TextArea,
  TextInput,
} from "../../../components/ui/form";
import {
  getTodayDateInputValue,
  toLocalDateTimePayload,
} from "../../../lib/date-utils";
import type {
  CustomerResponse,
  TransactionFormSubmitPayload,
  TransactionFormValues,
} from "../transactions.types";

type TransactionFormModalProps = {
  customers: CustomerResponse[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (payload: TransactionFormSubmitPayload) => Promise<void>;
};

type FormErrors = {
  customerId?: string;
  amount?: string;
  transactionDate?: string;
};

function getInitialFormValues(
  customers: CustomerResponse[],
): TransactionFormValues {
  const defaultCustomer =
    customers.find((customer) => customer.active) ?? customers[0] ?? null;

  return {
    customerId: defaultCustomer ? String(defaultCustomer.id) : "",
    amount: "",
    description: "",
    transactionDate: getTodayDateInputValue(),
  };
}

function validate(values: TransactionFormValues): FormErrors {
  const errors: FormErrors = {};
  const amount = Number(values.amount);

  if (!values.customerId.trim()) {
    errors.customerId = "Customer is required.";
  }

  if (!values.amount.trim()) {
    errors.amount = "Amount is required.";
  } else if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = "Amount must be a positive number.";
  }

  if (!values.transactionDate.trim()) {
    errors.transactionDate = "Transaction date is required.";
  }

  return errors;
}

function getCustomerLabel(customer: CustomerResponse): string {
  return `${customer.firstName} ${customer.lastName} (${customer.email})`;
}

export function TransactionFormModal({
  customers,
  isSaving,
  onClose,
  onSubmit,
}: TransactionFormModalProps) {
  const dialogTitleId = useId();
  const customerIdFieldId = useId();
  const amountFieldId = useId();
  const descriptionFieldId = useId();
  const transactionDateFieldId = useId();

  const [values, setValues] = useState<TransactionFormValues>(() =>
    getInitialFormValues(customers),
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const hasCustomers = customers.length > 0;

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

  const handleInputChange = (
    field: keyof TransactionFormValues,
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

    const payload: TransactionFormSubmitPayload = {
      customerId: Number(values.customerId),
      amount: Number(values.amount),
      description: values.description.trim() || undefined,
      transactionDate: toLocalDateTimePayload(values.transactionDate),
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
              New Transaction
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Create a purchase transaction and award points.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close transaction form"
            className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        {!hasCustomers ? (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
            No customers available yet. Create a customer before registering
            transactions.
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
              label="Amount"
              htmlFor={amountFieldId}
              error={errors.amount}
            >
              <TextInput
                id={amountFieldId}
                type="number"
                min="0.01"
                step="0.01"
                value={values.amount}
                disabled={isSaving}
                error={Boolean(errors.amount)}
                onChange={(event) =>
                  handleInputChange("amount", event.target.value)
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

            <FormField
              label="Transaction Date"
              htmlFor={transactionDateFieldId}
              error={errors.transactionDate}
            >
              <DateField
                id={transactionDateFieldId}
                value={values.transactionDate}
                disabled={isSaving}
                error={Boolean(errors.transactionDate)}
                onChange={(event) =>
                  handleInputChange("transactionDate", event.target.value)
                }
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
                disabled={isSaving || !hasCustomers}
                className="rounded-lg border border-slate-300 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:border-slate-400 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-100 dark:text-slate-900 dark:hover:border-slate-500 dark:hover:bg-white"
              >
                {isSaving ? "Saving..." : "Create Transaction"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
