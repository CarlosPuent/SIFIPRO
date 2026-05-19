export function getTodayDateInputValue(baseDate = new Date()): string {
  const year = baseDate.getFullYear();
  const month = String(baseDate.getMonth() + 1).padStart(2, "0");
  const day = String(baseDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function toLocalDateTimePayload(
  dateInput: string,
  defaultTime = "00:00:00",
): string {
  const normalized = dateInput.trim();

  if (!normalized) {
    return normalized;
  }

  if (normalized.includes("T")) {
    return normalized;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return `${normalized}T${defaultTime}`;
  }

  return normalized;
}
