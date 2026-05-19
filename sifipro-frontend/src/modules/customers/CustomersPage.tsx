import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { extractErrorMessage } from "../../lib/error-utils";
import { CustomerFormModal } from "./components/CustomerFormModal";
import { CustomersTable } from "./components/CustomersTable";
import {
  activateCustomer,
  createCustomer,
  deactivateCustomer,
  getCustomerById,
  getCustomers,
  updateCustomer,
} from "./customers.service";
import type {
  CreateCustomerRequest,
  CustomerResponse,
  UpdateCustomerRequest,
} from "./customers.types";

type ModalMode = "create" | "edit";

function CustomersLoadingState() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-52 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-lg max-w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      </div>

      <div className="h-16 animate-pulse rounded-2xl border border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/70" />
      <div className="h-72 animate-pulse rounded-2xl border border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/70" />
    </section>
  );
}

type CustomersErrorStateProps = {
  message: string;
  onRetry: () => void;
};

function CustomersErrorState({ message, onRetry }: CustomersErrorStateProps) {
  return (
    <SurfaceCard className="p-8">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Failed to load customers
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        {message}
      </p>
      <Button variant="secondary" className="mt-5" onClick={onRetry}>
        Retry
      </Button>
    </SurfaceCard>
  );
}

function CustomersEmptyState() {
  return (
    <SurfaceCard className="p-8">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        No customers yet
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Create your first customer to begin managing tenant customer records.
      </p>
    </SurfaceCard>
  );
}

export function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null,
  );
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerResponse | null>(null);
  const [isLoadingModalData, setIsLoadingModalData] = useState(false);

  const [isSavingModal, setIsSavingModal] = useState(false);
  const [actionCustomerId, setActionCustomerId] = useState<number | null>(null);

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      setLoadError(extractErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  const handleOpenCreate = () => {
    setModalMode("create");
    setSelectedCustomerId(null);
    setSelectedCustomer(null);
    setIsLoadingModalData(false);
    setModalOpen(true);
  };

  const handleOpenEdit = async (customerId: number) => {
    setModalMode("edit");
    setSelectedCustomerId(customerId);
    setSelectedCustomer(null);
    setIsLoadingModalData(true);
    setModalOpen(true);

    try {
      const customer = await getCustomerById(customerId);
      setSelectedCustomer(customer);
    } catch (error) {
      setModalOpen(false);
      toast.error(`Could not load customer details. ${extractErrorMessage(error)}`);
    } finally {
      setIsLoadingModalData(false);
    }
  };

  const handleCloseModal = () => {
    if (isSavingModal) {
      return;
    }

    setModalOpen(false);
  };

  const handleSubmitCustomer = async (
    payload: CreateCustomerRequest | UpdateCustomerRequest,
  ) => {
    setIsSavingModal(true);

    try {
      if (modalMode === "create") {
        await createCustomer(payload as CreateCustomerRequest);
        toast.success("Customer created successfully.");
      } else {
        if (!selectedCustomerId) {
          throw new Error("Customer identifier is missing.");
        }

        await updateCustomer(
          selectedCustomerId,
          payload as UpdateCustomerRequest,
        );
        toast.success("Customer updated successfully.");
      }

      setModalOpen(false);
      await loadCustomers();
    } catch (error) {
      toast.error(`Could not save customer. ${extractErrorMessage(error)}`);
    } finally {
      setIsSavingModal(false);
    }
  };

  const handleToggleCustomerStatus = async (customer: CustomerResponse) => {
    setActionCustomerId(customer.id);

    try {
      if (customer.active) {
        await deactivateCustomer(customer.id);
        toast.success("Customer deactivated successfully.");
      } else {
        await activateCustomer(customer.id);
        toast.success("Customer activated successfully.");
      }

      await loadCustomers();
    } catch (error) {
      toast.error(`Could not update customer status. ${extractErrorMessage(error)}`);
    } finally {
      setActionCustomerId(null);
    }
  };

  if (isLoading) {
    return <CustomersLoadingState />;
  }

  if (loadError) {
    return <CustomersErrorState message={loadError} onRetry={loadCustomers} />;
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Customers
        </h1>
        <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
          Manage tenant-scoped customer profiles and account status in one
          structured workspace.
        </p>
      </header>

      <SurfaceCard className="flex items-center justify-between p-4 sm:p-5">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100">
            Customer Management
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Create, edit, and control customer accounts for the authenticated
            tenant.
          </p>
        </div>

        <Button variant="primary" onClick={handleOpenCreate}>
          New Customer
        </Button>
      </SurfaceCard>

      {customers.length === 0 ? (
        <CustomersEmptyState />
      ) : (
        <CustomersTable
          customers={customers}
          actionCustomerId={actionCustomerId}
          onEdit={handleOpenEdit}
          onToggleStatus={handleToggleCustomerStatus}
        />
      )}

      <CustomerFormModal
        open={modalOpen}
        mode={modalMode}
        initialCustomer={selectedCustomer}
        isSaving={isSavingModal}
        isLoadingInitialData={isLoadingModalData}
        onClose={handleCloseModal}
        onSubmit={handleSubmitCustomer}
      />
    </section>
  );
}
