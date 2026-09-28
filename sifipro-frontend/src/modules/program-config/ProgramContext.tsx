import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "../../auth/useAuth";
import { extractErrorMessage } from "../../lib/error-utils";
import { getProgramConfigs } from "./program-config.service";
import type { ProgramConfigResponse } from "./program-config.types";
import { ProgramContext, type ProgramContextValue } from "./useProgram";

const CURRENT_PROGRAM_ID_STORAGE_KEY = "sifipro-current-program-id";

type ProgramProviderProps = {
  children: ReactNode;
};

function readStoredCurrentProgramId(): number | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(CURRENT_PROGRAM_ID_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  const parsedValue = Number(rawValue);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function persistCurrentProgramId(programId: number | null): void {
  if (typeof window === "undefined") {
    return;
  }

  if (programId === null) {
    window.localStorage.removeItem(CURRENT_PROGRAM_ID_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(
    CURRENT_PROGRAM_ID_STORAGE_KEY,
    String(programId),
  );
}

function resolveCurrentProgramId(
  programs: ProgramConfigResponse[],
  candidateIds: Array<number | null>,
): number | null {
  if (programs.length === 0) {
    return null;
  }

  if (programs.length === 1) {
    return programs[0].id;
  }

  for (const candidateId of candidateIds) {
    if (
      candidateId !== null &&
      programs.some((program) => program.id === candidateId)
    ) {
      return candidateId;
    }
  }

  return programs[0].id;
}

export function ProgramProvider({ children }: ProgramProviderProps) {
  const { isAuthenticated } = useAuth();

  const [programs, setPrograms] = useState<ProgramConfigResponse[]>([]);
  const [currentProgramId, setCurrentProgramId] = useState<number | null>(() =>
    readStoredCurrentProgramId(),
  );
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(false);
  const [programsError, setProgramsError] = useState<string | null>(null);

  const reloadPrograms = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    setIsLoadingPrograms(true);
    setProgramsError(null);

    try {
      const nextPrograms = await getProgramConfigs();

      setPrograms(nextPrograms);
      setCurrentProgramId((previousProgramId) =>
        resolveCurrentProgramId(nextPrograms, [
          previousProgramId,
          readStoredCurrentProgramId(),
        ]),
      );
    } catch (error) {
      setPrograms([]);
      setCurrentProgramId(null);
      setProgramsError(
        extractErrorMessage(error, "Could not load tenant programs."),
      );
    } finally {
      setIsLoadingPrograms(false);
    }
  }, [isAuthenticated]);

  const setCurrentProgramById = useCallback(
    (id: number) => {
      setCurrentProgramId((previousProgramId) =>
        programs.some((program) => program.id === id) ? id : previousProgramId,
      );
    },
    [programs],
  );

  // Reset or start loading when the session state changes, during render (React's
  // "adjusting state when a prop changes" pattern); the effect below only applies
  // the async result. Explicit reloads go through reloadPrograms().
  const [syncedAuthState, setSyncedAuthState] = useState<boolean | undefined>(undefined);
  if (syncedAuthState !== isAuthenticated) {
    setSyncedAuthState(isAuthenticated);
    setProgramsError(null);
    if (isAuthenticated) {
      setIsLoadingPrograms(true);
    } else {
      setPrograms([]);
      setCurrentProgramId(null);
      setIsLoadingPrograms(false);
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      persistCurrentProgramId(null);
      return;
    }

    let isActive = true;

    getProgramConfigs()
      .then((nextPrograms) => {
        if (!isActive) return;
        setPrograms(nextPrograms);
        setCurrentProgramId((previousProgramId) =>
          resolveCurrentProgramId(nextPrograms, [
            previousProgramId,
            readStoredCurrentProgramId(),
          ]),
        );
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        setPrograms([]);
        setCurrentProgramId(null);
        setProgramsError(extractErrorMessage(error, "Could not load tenant programs."));
      })
      .finally(() => {
        if (isActive) setIsLoadingPrograms(false);
      });

    return () => {
      isActive = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    persistCurrentProgramId(currentProgramId);
  }, [currentProgramId, isAuthenticated]);

  const currentProgram = useMemo(() => {
    if (currentProgramId === null) {
      return null;
    }

    return programs.find((program) => program.id === currentProgramId) ?? null;
  }, [programs, currentProgramId]);

  const value = useMemo<ProgramContextValue>(
    () => ({
      programs,
      currentProgram,
      currentProgramId,
      setCurrentProgramById,
      reloadPrograms,
      isLoadingPrograms,
      programsError,
    }),
    [
      programs,
      currentProgram,
      currentProgramId,
      setCurrentProgramById,
      reloadPrograms,
      isLoadingPrograms,
      programsError,
    ],
  );

  return (
    <ProgramContext.Provider value={value}>{children}</ProgramContext.Provider>
  );
}
