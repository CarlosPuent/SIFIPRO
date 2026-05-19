import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { extractErrorMessage } from "../../lib/error-utils";
import { useProgram } from "../program-config/ProgramContext";
import { CustomerRedemptionsTable } from "./components/CustomerRedemptionsTable";
import { RedemptionFormModal } from "./components/RedemptionFormModal";
import { RedemptionsTable } from "./components/RedemptionsTable";
import {
  createRedemption,
  getAllRedemptions,
  getCustomers,
  getRedemptionById,
  getRedemptionsByCustomerId,
  getRewardsByProgram,
} from "./redemptions.service";
import type {
  CreateRedemptionRequest,
  CustomerResponse,
  RedemptionResponse,
  RewardResponse,
} from "./redemptions.types";

type InitialDataResult = {
  redemptionsData: RedemptionResponse[];
  customersData: CustomerResponse[];
  rewardsData: RewardResponse[];
};

type ProgramSelectionStateProps = {
  isLoadingPrograms: boolean;
  programsError: string | null;
};

function getCustomerFullName(customer: CustomerResponse): string {
  return `${customer.firstName} ${customer.lastName}`;
}

function filterRedemptionsByProgram(
  redemptions: RedemptionResponse[],
  programConfigId: number,
): RedemptionResponse[] {
  return redemptions.filter(
    (redemption) => redemption.programConfigId === programConfigId,
  );
}

function RedemptionsLoadingState() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-52 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-lg max-w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      </div>

      <div className="h-16 animate-pulse rounded-2xl border border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/70" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl border border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/70" />
        <div className="h-72 animate-pulse rounded-2xl border border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/70" />
      </div>
    </section>
  );
}

function RedemptionsProgramSelectionState({
  isLoadingPrograms,
  programsError,
}: ProgramSelectionStateProps) {
  return (
    <SurfaceCard className="p-8">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {isLoadingPrograms ? "Loading programs" : "No program selected"}
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        {isLoadingPrograms
          ? "Please wait while we resolve available programs for this tenant."
          : "Select a program from the header to register and review redemptions."}
      </p>
      {programsError ? (
        <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">
          {programsError}
        </p>
      ) : null}
    </SurfaceCard>
  );
}

type RedemptionsErrorStateProps = {
  message: string;
  onRetry: () => void;
};

function RedemptionsErrorState({
  message,
  onRetry,
}: RedemptionsErrorStateProps) {
  return (
    <SurfaceCard className="p-8">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Failed to load redemptions
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

function RedemptionsEmptyState() {
  return (
    <SurfaceCard className="p-8">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        No redemptions yet
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Create your first redemption for the selected program.
      </p>
    </SurfaceCard>
  );
}

export function RedemptionsPage() {
  const { currentProgram, isLoadingPrograms, programsError } = useProgram();
  const currentProgramId = currentProgram?.id ?? null;

  const [redemptions, setRedemptions] = useState<RedemptionResponse[]>([]);
  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [rewards, setRewards] = useState<RewardResponse[]>([]);
  const [customerHistory, setCustomerHistory] = useState<RedemptionResponse[]>(
    [],
  );

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSavingModal, setIsSavingModal] = useState(false);

  const [selectedRedemptionId, setSelectedRedemptionId] = useState<
    number | null
  >(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null,
  );

  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const requestCustomerHistory = useCallback(
    async (customerId: number, programConfigId: number) => {
      const history = await getRedemptionsByCustomerId(customerId);
      return filterRedemptionsByProgram(history, programConfigId);
    },
    [],
  );

  const loadCustomerHistory = useCallback(
    async (customerId: number, programConfigId: number) => {
      setIsHistoryLoading(true);
      setHistoryError(null);

      try {
        const history = await requestCustomerHistory(
          customerId,
          programConfigId,
        );
        setCustomerHistory(history);
      } catch (error) {
        setCustomerHistory([]);
        setHistoryError(extractErrorMessage(error));
      } finally {
        setIsHistoryLoading(false);
      }
    },
    [requestCustomerHistory],
  );

  const fetchInitialData = useCallback(
    async (programConfigId: number): Promise<InitialDataResult> => {
      const [allRedemptionsData, customersData, rewardsData] =
        await Promise.all([
          getAllRedemptions(),
          getCustomers(),
          getRewardsByProgram(programConfigId),
        ]);

      return {
        redemptionsData: filterRedemptionsByProgram(
          allRedemptionsData,
          programConfigId,
        ),
        customersData,
        rewardsData,
      };
    },
    [],
  );

  const loadInitialData = useCallback(async () => {
    if (!currentProgramId) {
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const data = await fetchInitialData(currentProgramId);

      setRedemptions(data.redemptionsData);
      setCustomers(data.customersData);
      setRewards(data.rewardsData);

      if (data.redemptionsData.length > 0) {
        const firstRedemption = data.redemptionsData[0];
        setSelectedRedemptionId(firstRedemption.id);
        setSelectedCustomerId(firstRedemption.customerId);
        await loadCustomerHistory(firstRedemption.customerId, currentProgramId);
      } else {
        setSelectedRedemptionId(null);
        setSelectedCustomerId(null);
        setCustomerHistory([]);
        setHistoryError(null);
      }
    } catch (error) {
      setLoadError(extractErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [currentProgramId, fetchInitialData, loadCustomerHistory]);

  useEffect(() => {
    if (!currentProgramId) {
      return;
    }

    let isCancelled = false;

    const initialize = async () => {
      try {
        const { redemptionsData, customersData, rewardsData } =
          await fetchInitialData(currentProgramId);

        if (isCancelled) {
          return;
        }

        setRedemptions(redemptionsData);
        setCustomers(customersData);
        setRewards(rewardsData);

        if (redemptionsData.length > 0) {
          const firstRedemption = redemptionsData[0];
          setSelectedRedemptionId(firstRedemption.id);
          setSelectedCustomerId(firstRedemption.customerId);

          setIsHistoryLoading(true);
          setHistoryError(null);

          try {
            const history = await requestCustomerHistory(
              firstRedemption.customerId,
              currentProgramId,
            );

            if (isCancelled) {
              return;
            }

            setCustomerHistory(history);
          } catch (error) {
            if (isCancelled) {
              return;
            }

            setCustomerHistory([]);
            setHistoryError(extractErrorMessage(error));
          } finally {
            if (!isCancelled) {
              setIsHistoryLoading(false);
            }
          }
        } else {
          setSelectedRedemptionId(null);
          setSelectedCustomerId(null);
          setCustomerHistory([]);
          setHistoryError(null);
        }
      } catch (error) {
        if (!isCancelled) {
          setLoadError(extractErrorMessage(error));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void initialize();

    return () => {
      isCancelled = true;
    };
  }, [currentProgramId, fetchInitialData, requestCustomerHistory]);

  useEffect(() => {
    if (currentProgramId) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setRedemptions([]);
      setCustomers([]);
      setRewards([]);
      setCustomerHistory([]);
      setSelectedRedemptionId(null);
      setSelectedCustomerId(null);
      setHistoryError(null);
      setLoadError(null);
      setIsLoading(false);
      setIsModalOpen(false);
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [currentProgramId]);

  const selectedRedemption = useMemo(
    () =>
      selectedRedemptionId
        ? (redemptions.find(
            (redemption) => redemption.id === selectedRedemptionId,
          ) ?? null)
        : null,
    [selectedRedemptionId, redemptions],
  );

  const selectedCustomerName = useMemo(() => {
    if (selectedRedemption) {
      return selectedRedemption.customerFullName;
    }

    if (!selectedCustomerId) {
      return null;
    }

    const selectedCustomer = customers.find(
      (customer) => customer.id === selectedCustomerId,
    );
    return selectedCustomer ? getCustomerFullName(selectedCustomer) : null;
  }, [selectedRedemption, selectedCustomerId, customers]);

  const handleOpenCreateModal = () => {
    if (!currentProgramId) {
      toast.error("Select a program before creating redemptions.");
      return;
    }

    setIsModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    if (isSavingModal) {
      return;
    }

    setIsModalOpen(false);
  };

  const handleSelectRedemption = (redemption: RedemptionResponse) => {
    if (!currentProgramId) {
      return;
    }

    setSelectedRedemptionId(redemption.id);
    setSelectedCustomerId(redemption.customerId);
    void loadCustomerHistory(redemption.customerId, currentProgramId);
  };

  const handleRetryHistory = () => {
    if (!selectedCustomerId || !currentProgramId) {
      return;
    }

    void loadCustomerHistory(selectedCustomerId, currentProgramId);
  };

  const handleSubmitRedemption = async (payload: CreateRedemptionRequest) => {
    if (!currentProgramId) {
      toast.error("Select a program before saving redemptions.");
      return;
    }

    setIsSavingModal(true);

    try {
      const createdRedemption = await createRedemption(payload);
      await getRedemptionById(createdRedemption.id);

      const refreshedAllRedemptions = await getAllRedemptions();
      const refreshedProgramRedemptions = filterRedemptionsByProgram(
        refreshedAllRedemptions,
        currentProgramId,
      );

      setRedemptions(refreshedProgramRedemptions);

      const nextSelectedRedemption =
        refreshedProgramRedemptions.find(
          (redemption) => redemption.id === createdRedemption.id,
        ) ??
        refreshedProgramRedemptions.find(
          (redemption) =>
            redemption.customerId === createdRedemption.customerId,
        ) ??
        null;

      if (nextSelectedRedemption) {
        setSelectedRedemptionId(nextSelectedRedemption.id);
        setSelectedCustomerId(nextSelectedRedemption.customerId);
        await loadCustomerHistory(
          nextSelectedRedemption.customerId,
          currentProgramId,
        );
      } else {
        setSelectedRedemptionId(null);
        setSelectedCustomerId(null);
        setCustomerHistory([]);
        setHistoryError(null);
      }

      setIsModalOpen(false);
      toast.success("Redemption created successfully.");
    } catch (error) {
      toast.error(`Could not create redemption. ${extractErrorMessage(error)}`);
    } finally {
      setIsSavingModal(false);
    }
  };

  if (isLoading) {
    return <RedemptionsLoadingState />;
  }

  if (!currentProgram) {
    return (
      <section className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Redemptions
          </h1>
          <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
            Redemptions are managed per program. Select a program from the
            header to continue.
          </p>
        </header>

        <RedemptionsProgramSelectionState
          isLoadingPrograms={isLoadingPrograms}
          programsError={programsError}
        />
      </section>
    );
  }

  if (loadError) {
    return (
      <RedemptionsErrorState message={loadError} onRetry={loadInitialData} />
    );
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Redemptions
        </h1>
        <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
          Register reward redemptions and monitor customer redemption history
          for the selected program.
        </p>
      </header>

      <SurfaceCard className="flex items-center justify-between p-4 sm:p-5">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100">
            Redemption Management
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Program: {currentProgram.programName} (ID: {currentProgram.id})
          </p>
        </div>

        <Button variant="primary" onClick={handleOpenCreateModal}>
          New Redemption
        </Button>
      </SurfaceCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3">
          {redemptions.length === 0 ? (
            <RedemptionsEmptyState />
          ) : (
            <RedemptionsTable
              redemptions={redemptions}
              selectedRedemptionId={selectedRedemptionId}
              onSelectRedemption={handleSelectRedemption}
            />
          )}
        </div>

        <div className="xl:col-span-2">
          <CustomerRedemptionsTable
            selectedCustomerName={selectedCustomerName}
            redemptions={customerHistory}
            isLoading={isHistoryLoading}
            errorMessage={historyError}
            onRetry={handleRetryHistory}
          />
        </div>
      </div>

      {isModalOpen ? (
        <RedemptionFormModal
          customers={customers}
          rewards={rewards}
          isSaving={isSavingModal}
          onClose={handleCloseCreateModal}
          onSubmit={handleSubmitRedemption}
        />
      ) : null}
    </section>
  );
}
