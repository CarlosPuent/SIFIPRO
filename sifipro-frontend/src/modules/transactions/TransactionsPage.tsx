import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { extractErrorMessage } from "../../lib/error-utils";
import { useProgram } from "../program-config/ProgramContext";
import { PointsMovementsTable } from "./components/PointsMovementsTable";
import { TransactionFormModal } from "./components/TransactionFormModal";
import { TransactionsTable } from "./components/TransactionsTable";
import {
  createPurchaseTransaction,
  getCustomers,
  getPointsMovementsByProgram,
  getTransactionsByProgram,
} from "./transactions.service";
import type {
  CreatePurchaseTransactionRequest,
  CustomerResponse,
  PointsMovementResponse,
  PurchaseTransactionResponse,
  TransactionFormSubmitPayload,
} from "./transactions.types";

function resolveAwardedPoints(
  transaction: PurchaseTransactionResponse,
): number | string {
  if (
    transaction.awardedPoints !== undefined &&
    transaction.awardedPoints !== null
  ) {
    return transaction.awardedPoints;
  }

  if (
    transaction.pointsEarned !== undefined &&
    transaction.pointsEarned !== null
  ) {
    return transaction.pointsEarned;
  }

  return 0;
}

function TransactionsLoadingState() {
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

type TransactionsErrorStateProps = {
  message: string;
  onRetry: () => void;
};

function TransactionsErrorState({
  message,
  onRetry,
}: TransactionsErrorStateProps) {
  return (
    <SurfaceCard className="p-8">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Failed to load transactions
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

function TransactionsEmptyState() {
  return (
    <SurfaceCard className="p-8">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        No transactions yet
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Create your first purchase transaction to start tracking points
        activity.
      </p>
    </SurfaceCard>
  );
}

type TransactionsProgramSelectionStateProps = {
  isLoadingPrograms: boolean;
  programsError: string | null;
};

function TransactionsProgramSelectionState({
  isLoadingPrograms,
  programsError,
}: TransactionsProgramSelectionStateProps) {
  return (
    <SurfaceCard className="p-8">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {isLoadingPrograms ? "Loading programs" : "No program selected"}
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        {isLoadingPrograms
          ? "Please wait while we resolve available programs for this tenant."
          : "Select a program from the header to register transactions and inspect points movements."}
      </p>
      {programsError ? (
        <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">
          {programsError}
        </p>
      ) : null}
    </SurfaceCard>
  );
}

export function TransactionsPage() {
  const { currentProgram, isLoadingPrograms, programsError } = useProgram();
  const currentProgramId = currentProgram?.id ?? null;

  const [transactions, setTransactions] = useState<
    PurchaseTransactionResponse[]
  >([]);
  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [pointsMovements, setPointsMovements] = useState<
    PointsMovementResponse[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSavingModal, setIsSavingModal] = useState(false);

  const loadProgramData = useCallback(async (programConfigId: number) => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const [transactionsData, pointsMovementsData, customersData] =
        await Promise.all([
          getTransactionsByProgram(programConfigId),
          getPointsMovementsByProgram(programConfigId),
          getCustomers(),
        ]);

      setTransactions(transactionsData);
      setPointsMovements(pointsMovementsData);
      setCustomers(customersData);
    } catch (error) {
      setLoadError(extractErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentProgramId) {
      setTransactions([]);
      setPointsMovements([]);
      setLoadError(null);
      setIsLoading(false);
      setIsModalOpen(false);
      return;
    }

    void loadProgramData(currentProgramId);
  }, [currentProgramId, loadProgramData]);

  const handleOpenCreateModal = () => {
    if (!currentProgramId) {
      toast.error("Select a program before creating transactions.");
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

  const handleSubmitTransaction = async (
    payload: TransactionFormSubmitPayload,
  ) => {
    if (!currentProgramId) {
      toast.error("Select a program before saving transactions.");
      return;
    }

    setIsSavingModal(true);

    try {
      const payloadWithProgram: CreatePurchaseTransactionRequest = {
        ...payload,
        programConfigId: currentProgramId,
      };

      const createdTransaction =
        await createPurchaseTransaction(payloadWithProgram);

      await loadProgramData(currentProgramId);

      setIsModalOpen(false);
      toast.success(
        `Transaction created. Awarded points: ${resolveAwardedPoints(createdTransaction)}.`,
      );
    } catch (error) {
      toast.error(`Could not create transaction. ${extractErrorMessage(error)}`);
    } finally {
      setIsSavingModal(false);
    }
  };

  if (isLoading) {
    return <TransactionsLoadingState />;
  }

  if (!currentProgram) {
    return (
      <section className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Transactions
          </h1>
          <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
            Transactions and points movements are managed per program. Select a
            program from the header to continue.
          </p>
        </header>

        <TransactionsProgramSelectionState
          isLoadingPrograms={isLoadingPrograms}
          programsError={programsError}
        />
      </section>
    );
  }

  if (loadError) {
    return (
      <TransactionsErrorState
        message={loadError}
        onRetry={() => {
          void loadProgramData(currentProgram.id);
        }}
      />
    );
  }

  const selectedProgramName = currentProgram.programName;

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Transactions
        </h1>
        <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
          Register purchases and monitor points movement history for the
          selected program.
        </p>
      </header>

      <SurfaceCard className="flex items-center justify-between p-4 sm:p-5">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100">
            Transaction Management
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Program: {selectedProgramName} (ID: {currentProgram.id})
          </p>
        </div>

        <Button variant="primary" onClick={handleOpenCreateModal}>
          New Transaction
        </Button>
      </SurfaceCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3">
          {transactions.length === 0 ? (
            <TransactionsEmptyState />
          ) : (
            <TransactionsTable transactions={transactions} />
          )}
        </div>

        <div className="xl:col-span-2">
          <PointsMovementsTable
            programName={selectedProgramName}
            movements={pointsMovements}
            isLoading={false}
            errorMessage={null}
            onRetry={() => {
              void loadProgramData(currentProgram.id);
            }}
          />
        </div>
      </div>

      {isModalOpen ? (
        <TransactionFormModal
          customers={customers}
          isSaving={isSavingModal}
          onClose={handleCloseCreateModal}
          onSubmit={handleSubmitTransaction}
        />
      ) : null}
    </section>
  );
}
