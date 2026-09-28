import axios from "axios";

type ErrorPayload = {
  message?: unknown;
  error?: unknown;
  detail?: unknown;
  details?: unknown;
  title?: unknown;
  errors?: unknown;
};

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readFromArray(value: unknown): string | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const firstString = value.find((item) => typeof item === "string" && item.trim());
  return firstString ? String(firstString).trim() : null;
}

function readFromErrorsObject(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  for (const entry of Object.values(value as Record<string, unknown>)) {
    const fromString = readString(entry);
    if (fromString) {
      return fromString;
    }

    const fromArray = readFromArray(entry);
    if (fromArray) {
      return fromArray;
    }
  }

  return null;
}

function readFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const normalized = payload as ErrorPayload;

  return (
    readString(normalized.message) ??
    readString(normalized.error) ??
    readString(normalized.detail) ??
    readString(normalized.details) ??
    readFromArray(normalized.details) ??
    readString(normalized.title) ??
    readFromErrorsObject(normalized.errors)
  );
}

// Shown for every 403, whatever the backend body says, so a blocked action always
// reads the same way in toasts and error states.
export const FORBIDDEN_MESSAGE = "You don't have permission to perform this action.";

export function extractErrorMessage(
  error: unknown,
  fallback = "An unexpected error occurred.",
): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 403) {
      return FORBIDDEN_MESSAGE;
    }

    const payloadMessage = readFromPayload(error.response?.data);
    if (payloadMessage) {
      return payloadMessage;
    }

    const directMessage = readString(error.message);
    return directMessage ?? fallback;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
