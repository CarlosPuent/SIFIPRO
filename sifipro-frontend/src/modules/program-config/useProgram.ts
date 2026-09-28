import { createContext, useContext } from "react";
import type { ProgramConfigResponse } from "./program-config.types";

export type ProgramContextValue = {
  programs: ProgramConfigResponse[];
  currentProgram: ProgramConfigResponse | null;
  currentProgramId: number | null;
  setCurrentProgramById: (id: number) => void;
  reloadPrograms: () => Promise<void>;
  isLoadingPrograms: boolean;
  programsError: string | null;
};

// Kept apart from ProgramContext.tsx so that file only exports its provider
// component (required by react-refresh for fast refresh to work).
export const ProgramContext = createContext<ProgramContextValue | undefined>(
  undefined,
);

export function useProgram() {
  const context = useContext(ProgramContext);

  if (!context) {
    throw new Error("useProgram must be used within ProgramProvider.");
  }

  return context;
}
