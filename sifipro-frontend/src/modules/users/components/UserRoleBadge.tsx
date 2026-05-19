import type { UserRole } from "../users.types";

type UserRoleBadgeProps = {
  role: UserRole;
};

const roleClasses: Record<UserRole, string> = {
  ADMIN:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300",
  STAFF: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
};

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${roleClasses[role]}`}
    >
      {role}
    </span>
  );
}
