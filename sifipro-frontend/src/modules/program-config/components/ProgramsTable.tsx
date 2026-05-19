import { Button } from "../../../components/ui/Button";
import { SurfaceCard } from "../../../components/ui/SurfaceCard";
import {
  formatDateTime,
  formatNumber,
  formatPoints,
} from "../../../lib/formatters";
import type { ProgramConfigResponse } from "../program-config.types";
import { ProgramStatusBadge } from "./ProgramStatusBadge";

type ProgramsTableProps = {
  programs: ProgramConfigResponse[];
  statusActionProgramId: number | null;
  onEdit: (program: ProgramConfigResponse) => void;
  onToggleStatus: (program: ProgramConfigResponse) => void;
};

export function ProgramsTable({
  programs,
  statusActionProgramId,
  onEdit,
  onToggleStatus,
}: ProgramsTableProps) {
  return (
    <SurfaceCard className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80">
        <h2 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100">
          Tenant Programs
        </h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Total: {programs.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50/70 text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
            <tr>
              <th className="px-5 py-3 font-semibold">Program</th>
              <th className="px-5 py-3 font-semibold">Points/$</th>
              <th className="px-5 py-3 font-semibold">Min Purchase</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Created</th>
              <th className="px-5 py-3 font-semibold">Updated</th>
              <th className="px-5 py-3 font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200/80 text-sm dark:divide-slate-800/80">
            {programs.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                >
                  No programs available for this tenant.
                </td>
              </tr>
            ) : (
              programs.map((program) => {
                const isStatusActionLoading =
                  statusActionProgramId === program.id;

                return (
                  <tr key={program.id} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-100">
                      {program.programName}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                      {formatPoints(program.pointsPerDollar)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                      {formatNumber(program.minimumPurchaseAmount, 2)}
                    </td>
                    <td className="px-5 py-3.5">
                      <ProgramStatusBadge active={program.active} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                      {formatDateTime(program.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                      {formatDateTime(program.updatedAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(program)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          isLoading={isStatusActionLoading}
                          onClick={() => onToggleStatus(program)}
                        >
                          {program.active ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </SurfaceCard>
  );
}
