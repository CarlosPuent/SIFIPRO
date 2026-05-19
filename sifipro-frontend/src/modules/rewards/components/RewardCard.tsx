import { Gift, Package, Pencil, Star } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { formatNumber } from "../../../lib/formatters";
import type { RewardResponse } from "../rewards.types";

const PLACEHOLDER_GRADIENTS = [
  "from-indigo-500 to-violet-600",
  "from-violet-500 to-fuchsia-600",
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-600",
];

function getPlaceholderGradient(name: string): string {
  return PLACEHOLDER_GRADIENTS[(name.charCodeAt(0) ?? 0) % PLACEHOLDER_GRADIENTS.length];
}

function toNum(value: number | string): number {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(n) ? n : 0;
}

type StockStatus = "out" | "low" | "ok";

function getStockStatus(stock: number): StockStatus {
  if (stock === 0) return "out";
  if (stock <= 5) return "low";
  return "ok";
}

type StockBadgeProps = { status: StockStatus; stock: number };

function StockBadge({ status, stock }: StockBadgeProps) {
  if (status === "out") {
    return (
      <span className="rounded-full border border-rose-300/70 bg-rose-100/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700 backdrop-blur-sm dark:border-rose-800/50 dark:bg-rose-950/80 dark:text-rose-300">
        Out of Stock
      </span>
    );
  }
  if (status === "low") {
    return (
      <span className="rounded-full border border-amber-300/70 bg-amber-100/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 backdrop-blur-sm dark:border-amber-800/50 dark:bg-amber-950/80 dark:text-amber-300">
        {stock} left
      </span>
    );
  }
  return null;
}

export type RewardCardProps = {
  reward: RewardResponse;
  isLoading: boolean;
  onEdit: (reward: RewardResponse) => void;
  onToggleStatus: (reward: RewardResponse) => void;
};

export function RewardCard({
  reward,
  isLoading,
  onEdit,
  onToggleStatus,
}: RewardCardProps) {
  const { name, description, requiredPoints, stock, active, imageUrl, programName } =
    reward;

  const points = toNum(requiredPoints);
  const stockStatus = getStockStatus(stock);
  const gradient = getPlaceholderGradient(name);

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800/80 dark:bg-slate-900/80 ${
        !active ? "opacity-65" : ""
      }`}
    >
      {/* ── Media zone ─────────────────────────────── */}
      <div className="relative aspect-3/2 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-linear-to-br ${gradient}`}
          >
            <Gift className="h-10 w-10 text-white/70" strokeWidth={1.5} />
          </div>
        )}

        {/* Inactive overlay */}
        {!active && (
          <div className="absolute inset-0 bg-slate-900/25 dark:bg-slate-950/40" />
        )}

        {/* Badge row */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide backdrop-blur-sm ${
              active
                ? "border-emerald-300/60 bg-emerald-100/90 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-950/80 dark:text-emerald-300"
                : "border-slate-300/60 bg-white/80 text-slate-600 dark:border-slate-700/50 dark:bg-slate-900/80 dark:text-slate-400"
            }`}
          >
            {active ? "Active" : "Inactive"}
          </span>

          {active ? <StockBadge status={stockStatus} stock={stock} /> : null}
        </div>
      </div>

      {/* ── Content ───────────────────────────────── */}
      <div className="flex flex-1 flex-col px-4 pt-3.5 pb-3">
        {programName ? (
          <p className="mb-1 truncate text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {programName}
          </p>
        ) : null}
        <h3 className="line-clamp-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
          {name}
        </h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {description ?? "No description provided."}
        </p>
      </div>

      {/* ── Points + Stock stats ───────────────────── */}
      <div className="border-t border-slate-100/80 bg-slate-50/60 px-4 py-3 dark:border-slate-800/60 dark:bg-slate-900/40">
        <div className="flex items-center justify-between gap-3">
          {/* Points */}
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-50 dark:bg-indigo-950/60">
              <Star
                className="h-3 w-3 text-indigo-600 dark:text-indigo-400"
                strokeWidth={2.5}
              />
            </span>
            <div className="leading-none">
              <p className="text-base font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
                {formatNumber(points, 0)}
              </p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400">
                pts required
              </p>
            </div>
          </div>

          {/* Stock */}
          <div className="flex items-center gap-1.5">
            <Package
              className={`h-3.5 w-3.5 shrink-0 ${
                stockStatus === "out"
                  ? "text-rose-500"
                  : stockStatus === "low"
                    ? "text-amber-500"
                    : "text-slate-400 dark:text-slate-500"
              }`}
              strokeWidth={2}
            />
            <div className="text-right leading-none">
              <p
                className={`text-sm font-semibold ${
                  stockStatus === "out"
                    ? "text-rose-600 dark:text-rose-400"
                    : stockStatus === "low"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-slate-700 dark:text-slate-200"
                }`}
              >
                {stock}
              </p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400">
                in stock
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Actions ───────────────────────────────── */}
      <div className="flex items-center gap-2 border-t border-slate-100/80 px-4 py-3 dark:border-slate-800/60">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Pencil className="h-3 w-3" />}
          onClick={() => onEdit(reward)}
          className="flex-1 justify-center"
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          isLoading={isLoading}
          onClick={() => onToggleStatus(reward)}
          className="flex-1 justify-center"
        >
          {active ? "Deactivate" : "Activate"}
        </Button>
      </div>
    </article>
  );
}
