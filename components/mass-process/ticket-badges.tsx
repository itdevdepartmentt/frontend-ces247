"use client";

import { cn } from "@/lib/utils";

/** Warna status dipusatkan di sini supaya tabel dan halaman detail konsisten. */
export function StatusBadge({ status }: { status: string | null }) {
  const value = status ?? "—";
  const tone =
    value === "Completed"
      ? "text-emerald-700 dark:text-emerald-300"
      : value === "In Progress"
        ? "text-amber-800 dark:text-amber-300"
        : "text-slate-600 dark:text-slate-300";

  return (
    <span className={cn("text-xs font-medium whitespace-nowrap", tone)}>
      {value}
    </span>
  );
}

/**
 * Semakin tua tiket semakin gelap warnanya — supaya tumpukan yang mengendap
 * langsung terlihat saat tabel dipindai sekilas.
 */
export function AgeingBadge({ bucket }: { bucket: string | null }) {
  if (!bucket) return <span className="text-muted-foreground">—</span>;

  const tone =
    bucket === ">14 Days"
      ? "text-red-700 dark:text-red-300"
      : bucket === "8-14 Days"
        ? "text-orange-700 dark:text-orange-300"
        : bucket === "4-7 Days"
          ? "text-amber-800 dark:text-amber-300"
          : "text-slate-600 dark:text-slate-300";

  return (
    <span className={cn("text-xs whitespace-nowrap", tone)}>{bucket}</span>
  );
}

export function BottleneckBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-xs text-muted-foreground">—</span>;
  return <span className="text-xs font-medium text-destructive">{value}</span>;
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            value >= 100 ? "bg-emerald-500" : "bg-primary",
          )}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
        {value}%
      </span>
    </div>
  );
}
