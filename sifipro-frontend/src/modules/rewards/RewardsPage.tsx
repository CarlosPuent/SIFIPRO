import { Gift, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { extractErrorMessage } from "../../lib/error-utils";
import { useProgram } from "../program-config/ProgramContext";
import { RewardFormModal } from "./components/RewardFormModal";
import { RewardsGrid } from "./components/RewardsGrid";
import {
  activateReward,
  createReward,
  deactivateReward,
  getRewardsByProgram,
  updateReward,
} from "./rewards.service";
import type {
  CreateRewardRequest,
  RewardFormSubmitPayload,
  RewardResponse,
} from "./rewards.types";

type ModalMode = "create" | "edit";

function RewardsLoadingState() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-44 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-lg max-w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      </div>

      <div className="h-16 animate-pulse rounded-2xl border border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/70" />

      {/* Card skeleton grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/70"
          >
            <div className="aspect-3/2 bg-slate-200 dark:bg-slate-800" />
            <div className="p-4 space-y-2.5">
              <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="border-t border-slate-100 dark:border-slate-800/80 px-4 py-3">
              <div className="h-6 w-28 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

type RewardsProgramSelectionStateProps = {
  isLoadingPrograms: boolean;
  programsError: string | null;
};

function RewardsProgramSelectionState({
  isLoadingPrograms,
  programsError,
}: RewardsProgramSelectionStateProps) {
  return (
    <SurfaceCard className="p-8">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {isLoadingPrograms ? "Loading programs" : "No program selected"}
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        {isLoadingPrograms
          ? "Please wait while we resolve available programs for this tenant."
          : "Select a program from the header to view and manage rewards."}
      </p>
      {programsError ? (
        <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">
          {programsError}
        </p>
      ) : null}
    </SurfaceCard>
  );
}

type RewardsErrorStateProps = {
  message: string;
  onRetry: () => void;
};

function RewardsErrorState({ message, onRetry }: RewardsErrorStateProps) {
  return (
    <SurfaceCard className="p-8">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Failed to load rewards
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

function RewardsEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300/80 bg-white/60 px-6 py-16 text-center dark:border-slate-700/80 dark:bg-slate-900/40">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50">
        <Gift className="h-7 w-7 text-indigo-500 dark:text-indigo-400" strokeWidth={1.5} />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
        No rewards yet
      </h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Create your first reward to start offering redemption options for this
        program.
      </p>
      <Button
        variant="primary"
        size="sm"
        leftIcon={<Plus className="h-3.5 w-3.5" />}
        onClick={onAdd}
        className="mt-5"
      >
        Add First Reward
      </Button>
    </div>
  );
}

export function RewardsPage() {
  const { currentProgram, isLoadingPrograms, programsError } = useProgram();
  const currentProgramId = currentProgram?.id ?? null;

  const [rewards, setRewards] = useState<RewardResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [selectedReward, setSelectedReward] = useState<RewardResponse | null>(
    null,
  );

  const [isSavingModal, setIsSavingModal] = useState(false);
  const [actionRewardId, setActionRewardId] = useState<number | null>(null);

  const loadRewards = useCallback(async (programConfigId: number) => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const data = await getRewardsByProgram(programConfigId);
      setRewards(data);
    } catch (error) {
      setLoadError(extractErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentProgramId) {
      setRewards([]);
      setLoadError(null);
      setIsLoading(false);
      setModalOpen(false);
      return;
    }

    void loadRewards(currentProgramId);
  }, [currentProgramId, loadRewards]);

  const handleOpenCreate = () => {
    if (!currentProgramId) {
      toast.error("Select a program before creating rewards.");
      return;
    }

    setModalMode("create");
    setSelectedReward(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (reward: RewardResponse) => {
    setModalMode("edit");
    setSelectedReward(reward);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSavingModal) {
      return;
    }

    setModalOpen(false);
  };

  const handleSubmitReward = async (payload: RewardFormSubmitPayload) => {
    if (!currentProgramId) {
      toast.error("Select a program before saving rewards.");
      return;
    }

    setIsSavingModal(true);

    try {
      const payloadWithProgram: CreateRewardRequest = {
        ...payload,
        programConfigId: currentProgramId,
      };

      if (modalMode === "create") {
        await createReward(payloadWithProgram);
        toast.success("Reward created successfully.");
      } else {
        if (!selectedReward) {
          throw new Error("Reward identifier is missing.");
        }

        await updateReward(selectedReward.id, payloadWithProgram);
        toast.success("Reward updated successfully.");
      }

      setModalOpen(false);
      await loadRewards(currentProgramId);
    } catch (error) {
      toast.error(`Could not save reward. ${extractErrorMessage(error)}`);
    } finally {
      setIsSavingModal(false);
    }
  };

  const handleToggleRewardStatus = async (reward: RewardResponse) => {
    if (!currentProgramId) {
      return;
    }

    setActionRewardId(reward.id);

    try {
      if (reward.active) {
        await deactivateReward(reward.id);
        toast.success("Reward deactivated successfully.");
      } else {
        await activateReward(reward.id);
        toast.success("Reward activated successfully.");
      }

      await loadRewards(currentProgramId);
    } catch (error) {
      toast.error(
        `Could not update reward status. ${extractErrorMessage(error)}`,
      );
    } finally {
      setActionRewardId(null);
    }
  };

  if (isLoading) {
    return <RewardsLoadingState />;
  }

  if (!currentProgram) {
    return (
      <section className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Rewards
          </h1>
          <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
            Rewards are managed per program. Select a program from the header to
            continue.
          </p>
        </header>

        <RewardsProgramSelectionState
          isLoadingPrograms={isLoadingPrograms}
          programsError={programsError}
        />
      </section>
    );
  }

  if (loadError) {
    return (
      <RewardsErrorState
        message={loadError}
        onRetry={() => {
          void loadRewards(currentProgram.id);
        }}
      />
    );
  }

  const activeCount = rewards.filter((r) => r.active).length;
  const lowStockCount = rewards.filter((r) => r.active && r.stock > 0 && r.stock <= 5).length;
  const outOfStockCount = rewards.filter((r) => r.active && r.stock === 0).length;

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Rewards
        </h1>
        <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
          Manage redemption rewards, point requirements, and stock availability
          for the selected program.
        </p>
      </header>

      {/* Toolbar */}
      <SurfaceCard className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100">
              {currentProgram.programName}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {rewards.length} reward{rewards.length !== 1 ? "s" : ""} · {activeCount} active
              {lowStockCount > 0 ? (
                <span className="ml-1.5 text-amber-600 dark:text-amber-400">
                  · {lowStockCount} low stock
                </span>
              ) : null}
              {outOfStockCount > 0 ? (
                <span className="ml-1.5 text-rose-600 dark:text-rose-400">
                  · {outOfStockCount} out of stock
                </span>
              ) : null}
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus className="h-3.5 w-3.5" />}
          onClick={handleOpenCreate}
        >
          New Reward
        </Button>
      </SurfaceCard>

      {rewards.length === 0 ? (
        <RewardsEmptyState onAdd={handleOpenCreate} />
      ) : (
        <RewardsGrid
          rewards={rewards}
          actionRewardId={actionRewardId}
          onEdit={handleOpenEdit}
          onToggleStatus={handleToggleRewardStatus}
        />
      )}

      <RewardFormModal
        open={modalOpen}
        mode={modalMode}
        initialReward={selectedReward}
        isSaving={isSavingModal}
        isLoadingInitialData={false}
        onClose={handleCloseModal}
        onSubmit={handleSubmitReward}
      />
    </section>
  );
}
