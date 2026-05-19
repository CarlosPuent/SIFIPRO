import { apiClient } from "../../lib/api-client";
import type {
  CreateProgramConfigRequest,
  ProgramConfigResponse,
  UpdateProgramConfigRequest,
} from "./program-config.types";

function isProgramConfigResponse(value: unknown): value is ProgramConfigResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return "id" in value && "programName" in value;
}

function normalizeProgramConfigs(data: unknown): ProgramConfigResponse[] {
  if (Array.isArray(data)) {
    return data.filter(isProgramConfigResponse);
  }

  if (isProgramConfigResponse(data)) {
    return [data];
  }

  if (
    data &&
    typeof data === "object" &&
    "programs" in data &&
    Array.isArray((data as { programs?: unknown }).programs)
  ) {
    return (data as { programs: unknown[] }).programs.filter(
      isProgramConfigResponse,
    );
  }

  return [];
}

export async function getProgramConfigs(): Promise<ProgramConfigResponse[]> {
  const response = await apiClient.get<unknown>("/api/program-config");
  return normalizeProgramConfigs(response.data);
}

export async function getProgramConfigById(
  id: number,
): Promise<ProgramConfigResponse> {
  const response = await apiClient.get<ProgramConfigResponse>(
    `/api/program-config/${id}`,
  );

  return response.data;
}

export async function createProgramConfig(
  payload: CreateProgramConfigRequest,
): Promise<ProgramConfigResponse> {
  const response = await apiClient.post<ProgramConfigResponse>(
    "/api/program-config",
    payload,
  );

  return response.data;
}

export async function updateProgramConfig(
  id: number,
  payload: UpdateProgramConfigRequest,
): Promise<ProgramConfigResponse>;
export async function updateProgramConfig(
  payload: UpdateProgramConfigRequest,
): Promise<ProgramConfigResponse>;
export async function updateProgramConfig(
  idOrPayload: number | UpdateProgramConfigRequest,
  maybePayload?: UpdateProgramConfigRequest,
): Promise<ProgramConfigResponse> {
  if (typeof idOrPayload === "number") {
    const response = await apiClient.put<ProgramConfigResponse>(
      `/api/program-config/${idOrPayload}`,
      maybePayload,
    );

    return response.data;
  }

  const currentProgram = await getProgramConfig();

  if (!currentProgram) {
    throw new Error("No program available to update.");
  }

  const response = await apiClient.put<ProgramConfigResponse>(
    `/api/program-config/${currentProgram.id}`,
    idOrPayload,
  );

  return response.data;
}

export async function activateProgramConfig(
  id: number,
): Promise<ProgramConfigResponse> {
  const response = await apiClient.patch<ProgramConfigResponse>(
    `/api/program-config/${id}/activate`,
  );

  return response.data;
}

export async function deactivateProgramConfig(
  id: number,
): Promise<ProgramConfigResponse> {
  const response = await apiClient.patch<ProgramConfigResponse>(
    `/api/program-config/${id}/deactivate`,
  );

  return response.data;
}

// Compatibility helper for callers that still expect a single current program.
export async function getProgramConfig(): Promise<ProgramConfigResponse | null> {
  const programs = await getProgramConfigs();
  return programs[0] ?? null;
}
