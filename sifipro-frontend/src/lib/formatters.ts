export function formatNumber(
  value: number | string,
  maximumFractionDigits = 2,
): string {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(parsed);
}

export function formatInteger(value: number | string): string {
  return formatNumber(value, 0);
}

export function formatPoints(value: number | string): string {
  return formatNumber(value, 2);
}

export function formatDateTime(value: string): string {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedDate);
}

export function fallbackText(
  value: string | null | undefined,
  fallback = "-",
): string {
  const normalized = value?.trim();
  return normalized ? normalized : fallback;
}
