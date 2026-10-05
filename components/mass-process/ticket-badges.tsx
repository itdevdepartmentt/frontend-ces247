"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Warna status dipusatkan di sini supaya tabel dan halaman detail konsisten. */
export function StatusBadge({ status }: { status: string | null }) {
  const value = status ?? "—";
  const tone =
    value === "Completed"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
      : value === "In Progress"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";

  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", tone)}>{value}</span>;
}

/**
 * Semakin tua tiket semakin gelap warnanya — supaya tumpukan yang mengendap
 * langsung terlihat saat tabel dipindai sekilas.
 */
export function AgeingBadge({ bucket }: { bucket: string | null }) {
  if (!bucket) return <span className="text-muted-foreground">—</span>;

  const tone =
    bucket === ">14 Days"
      ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
      : bucket === "8-14 Days"
        ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
        : bucket === "4-7 Days"
          ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";

  return <span className={cn("rounded px-1.5 py-0.5 text-xs", tone)}>{bucket}</span>;
}

export function BottleneckBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <Badge variant="destructive" className="font-normal">
      {value}
    </Badge>
  );
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
