import type { AuthRole } from "../auth/auth.types";

export type NavigationItem = {
  label: string;
  path: `/${string}`;
  description: string;
  roles?: AuthRole[];
};
