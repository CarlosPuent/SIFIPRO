type InlineAlertTone = "success" | "error";

type InlineAlertProps = {
  tone: InlineAlertTone;
  message: string;
};

const toneClasses: Record<InlineAlertTone, string> = {
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/80 dark:bg-emerald-950/50 dark:text-emerald-200",
  error:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/80 dark:bg-rose-950/40 dark:text-rose-200",
};

export function InlineAlert({ tone, message }: InlineAlertProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm ${toneClasses[tone]}`}
    >
      {message}
    </div>
  );
}
