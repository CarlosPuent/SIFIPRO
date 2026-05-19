import { Button } from "../../../components/ui/Button";
import { SurfaceCard } from "../../../components/ui/SurfaceCard";
import type { UserResponse } from "../users.types";
import { UserRoleBadge } from "./UserRoleBadge";
import { UserStatusBadge } from "./UserStatusBadge";

type UsersTableProps = {
  users: UserResponse[];
  statusActionUserId: number | null;
  passwordActionUserId: number | null;
  onEdit: (id: number) => void;
  onToggleStatus: (user: UserResponse) => void;
  onChangePassword: (user: UserResponse) => void;
};

function getFullName(user: UserResponse): string {
  return `${user.firstName} ${user.lastName}`;
}

export function UsersTable({
  users,
  statusActionUserId,
  passwordActionUserId,
  onEdit,
  onToggleStatus,
  onChangePassword,
}: UsersTableProps) {
  return (
    <SurfaceCard className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100">
            Internal Users
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Tenant admin and staff accounts.
          </p>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Total: {users.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50/70 text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
            <tr>
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Email</th>
              <th className="px-5 py-3 font-semibold">Role</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200/80 text-sm dark:divide-slate-800/80">
            {users.map((user) => {
              const isStatusActionLoading = statusActionUserId === user.id;
              const isPasswordActionLoading = passwordActionUserId === user.id;

              return (
                <tr key={user.id} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-100">
                    {getFullName(user)}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                    {user.email}
                  </td>
                  <td className="px-5 py-3.5">
                    <UserRoleBadge role={user.role} />
                  </td>
                  <td className="px-5 py-3.5">
                    <UserStatusBadge active={user.active} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(user.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        isLoading={isStatusActionLoading}
                        onClick={() => onToggleStatus(user)}
                      >
                        {user.active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        isLoading={isPasswordActionLoading}
                        onClick={() => onChangePassword(user)}
                      >
                        Change Password
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SurfaceCard>
  );
}
