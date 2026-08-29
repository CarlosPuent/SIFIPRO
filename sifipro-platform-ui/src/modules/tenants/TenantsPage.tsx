import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { extractErrorMessage } from "../../lib/error-utils";
import { CreateTenantModal } from "./components/CreateTenantModal";
import { TenantsTable } from "./components/TenantsTable";
import {
  activateTenant,
  createTenant,
  deactivateTenant,
  getTenants,
} from "./tenant.service";
import type { CreateTenantRequest, TenantResponse } from "./tenant.types";

function TenantsLoadingState() {
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

type TenantsErrorStateProps = {
  message: string;
  onRetry: () => void;
};

function TenantsErrorState({ message, onRetry }: TenantsErrorStateProps) {
  return (
    <SurfaceCard className="p-8">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Failed to load tenants
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

function TenantsEmptyState() {
  return (
    <SurfaceCard className="p-8">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        No tenants yet
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Create the first tenant to start provisioning the platform.
      </p>
    </SurfaceCard>
  );
}

export function TenantsPage() {
  const [tenants, setTenants] = useState<TenantResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [isSavingModal, setIsSavingModal] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [actionTenantId, setActionTenantId] = useState<number | null>(null);

  const loadTenants = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const data = await getTenants();
      setTenants(data);
    } catch (error) {
      setLoadError(extractErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTenants();
  }, [loadTenants]);

  const handleOpenCreate = () => {
    setModalError(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSavingModal) {
      return;
    }

    setModalOpen(false);
  };

  const handleSubmitTenant = async (payload: CreateTenantRequest) => {
    setIsSavingModal(true);
    setModalError(null);

    try {
      await createTenant(payload);
      toast.success("Tenant created successfully.");
      setModalOpen(false);
      await loadTenants();
    } catch (error) {
      // Shown inline in the form (not a toast) so the user knows which field to
      // fix — e.g. a 409 for a duplicate tenant code or admin email.
      setModalError(extractErrorMessage(error));
    } finally {
      setIsSavingModal(false);
    }
  };

  const handleToggleTenantStatus = async (tenant: TenantResponse) => {
    if (tenant.active) {
      const confirmed = window.confirm(
        `Deactivate "${tenant.name}"? Its users will no longer be able to operate in tenant-api.`,
      );

      if (!confirmed) {
        return;
      }
    }

    setActionTenantId(tenant.id);

    try {
      if (tenant.active) {
        await deactivateTenant(tenant.id);
        toast.success("Tenant deactivated successfully.");
      } else {
        await activateTenant(tenant.id);
        toast.success("Tenant activated successfully.");
      }

      await loadTenants();
    } catch (error) {
      toast.error(`Could not update tenant status. ${extractErrorMessage(error)}`);
    } finally {
      setActionTenantId(null);
    }
  };

  if (isLoading) {
    return <TenantsLoadingState />;
  }

  if (loadError) {
    return <TenantsErrorState message={loadError} onRetry={loadTenants} />;
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Tenants
        </h1>
        <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
          Provision new tenants and control platform-wide access in one place.
        </p>
      </header>

      <SurfaceCard className="flex items-center justify-between p-4 sm:p-5">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100">
            Tenant Management
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Create tenants and activate or deactivate their access.
          </p>
        </div>

        <Button variant="primary" onClick={handleOpenCreate}>
          New Tenant
        </Button>
      </SurfaceCard>

      {tenants.length === 0 ? (
        <TenantsEmptyState />
      ) : (
        <TenantsTable
          tenants={tenants}
          actionTenantId={actionTenantId}
          onToggleStatus={handleToggleTenantStatus}
        />
      )}

      <CreateTenantModal
        open={modalOpen}
        isSaving={isSavingModal}
        serverError={modalError}
        onClose={handleCloseModal}
        onSubmit={handleSubmitTenant}
      />
    </section>
  );
}
