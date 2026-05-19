import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { extractErrorMessage } from "../../lib/error-utils";
import { getCustomerProfile, getCustomerPointsHistory } from "./customer-profile.service";
import type {
  CustomerProfileResponse,
  PointsHistoryEntry,
} from "./customer-profile.types";
import { CustomerActivityFeed } from "./components/CustomerActivityFeed";
import { CustomerProfileHeader } from "./components/CustomerProfileHeader";
import { CustomerStatCards } from "./components/CustomerStatCards";
import { PointsHistoryChart } from "./components/PointsHistoryChart";

function ProfileLoadingSkeleton() {
  return (
    <section className="space-y-5">
      {/* Header skeleton */}
      <div className="animate-pulse rounded-2xl border border-slate-200/80 bg-white/80 p-6 dark:border-slate-800/80 dark:bg-slate-900/70 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="h-20 w-20 flex-shrink-0 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="flex-1 space-y-3">
            <div className="h-8 w-64 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-10 w-36 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl border border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/70"
          />
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="h-72 animate-pulse rounded-2xl border border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/70" />

      {/* Activity feeds skeleton */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="h-64 animate-pulse rounded-2xl border border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/70" />
        <div className="h-64 animate-pulse rounded-2xl border border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/70" />
      </div>
    </section>
  );
}

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
  onBack: () => void;
};

function ProfileErrorState({ message, onRetry, onBack }: ErrorStateProps) {
  return (
    <SurfaceCard className="p-8">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Failed to load customer profile
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        {message}
      </p>
      <div className="mt-5 flex items-center gap-3">
        <Button variant="secondary" onClick={onRetry}>
          Retry
        </Button>
        <Button
          variant="ghost"
          leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
          onClick={onBack}
        >
          Back to Customers
        </Button>
      </div>
    </SurfaceCard>
  );
}

export function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<CustomerProfileResponse | null>(null);
  const [pointsHistory, setPointsHistory] = useState<PointsHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const customerId = id ? parseInt(id, 10) : null;

  const loadData = useCallback(async () => {
    if (!customerId || !Number.isFinite(customerId)) {
      setError("Invalid customer ID.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [profileData, historyData] = await Promise.all([
        getCustomerProfile(customerId),
        getCustomerPointsHistory(customerId).catch(() => [] as PointsHistoryEntry[]),
      ]);

      setProfile(profileData);
      setPointsHistory(historyData);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not load customer profile."));
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleBack = () => {
    navigate("/customers");
  };

  const transactions =
    profile?.recentTransactions ?? profile?.transactions ?? [];
  const redemptions =
    profile?.recentRedemptions ?? profile?.redemptions ?? [];

  if (isLoading) {
    return (
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Customers
          </button>
        </div>
        <ProfileLoadingSkeleton />
      </section>
    );
  }

  if (error || !profile) {
    return (
      <section className="space-y-5">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Customers
        </button>
        <ProfileErrorState
          message={error ?? "Profile data is unavailable."}
          onRetry={loadData}
          onBack={handleBack}
        />
      </section>
    );
  }

  return (
    <section className="space-y-5">
      {/* Back navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Customers
        </button>
        <p className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-600 sm:block">
          Customer Profile
        </p>
      </div>

      {/* Premium header */}
      <CustomerProfileHeader profile={profile} />

      {/* 4 stat cards */}
      <CustomerStatCards profile={profile} />

      {/* Points history chart */}
      <PointsHistoryChart history={pointsHistory} />

      {/* Activity feeds */}
      <CustomerActivityFeed
        transactions={transactions}
        redemptions={redemptions}
      />
    </section>
  );
}
