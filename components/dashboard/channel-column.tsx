import { TopItem } from "@/types/dashboard";
import { cn } from "@/lib/utils";

interface ChannelColumnProps {
  icon: React.ReactNode;
  title: string;
  sla: string;
  open: number;
  closed: number;
  topCorporateData: TopItem[];
  topKipData: TopItem[];
  isLoading?: boolean;
}

const corporateColumns: { key: keyof TopItem; label: string }[] = [
  { key: "name", label: "Perusahaan" },
  { key: "total", label: "Interaksi" },
  { key: "ticket", label: "Tiket" },
  { key: "pctFcr", label: "%FCR" },
];

const kipColumns: { key: keyof TopItem; label: string }[] = [
  { key: "name", label: "Kategori" },
  { key: "total", label: "Interaksi" },
  { key: "ticket", label: "Tiket" },
  { key: "pctFcr", label: "%FCR" },
];

function FcrBadge({ value }: { value: string | number }) {
  const num = Number(value);
  const isRed = num < 75;
  const isYellow = num >= 75 && num <= 82;
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-black text-[9px] px-1.5 py-0.5 rounded-md tabular-nums",
        isRed
          ? "bg-rose-500/15 text-rose-500 dark:text-rose-400 ring-1 ring-rose-500/30"
          : isYellow
          ? "bg-amber-500/15 text-amber-500 dark:text-amber-400 ring-1 ring-amber-500/30"
          : "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 ring-1 ring-emerald-500/30"
      )}
    >
      {value}%
    </span>
  );
}

function DataTable({
  label,
  accentColor,
  columns,
  data,
}: {
  label: string;
  accentColor: string;
  columns: { key: keyof TopItem; label: string }[];
  data: TopItem[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {/* Section Label */}
      <div className="flex items-center gap-2">
        <div className={cn("w-0.5 h-3 rounded-full", accentColor)} />
        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
          {label}
        </span>
        <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700/50" />
      </div>

      {/* Table */}
      <div className="rounded-lg overflow-hidden border border-slate-100 dark:border-slate-700/40">
        {/* thead */}
        <div className="grid bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-700/40"
          style={{ gridTemplateColumns: "1fr 52px 44px 44px" }}>
          {columns.map((col) => (
            <div
              key={col.key}
              className={cn(
                "px-2 py-1.5 text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500",
                col.key !== "name" && "text-center"
              )}
            >
              {col.label}
            </div>
          ))}
        </div>

        {/* tbody */}
        {data.length === 0 ? (
          <div className="flex items-center justify-center py-5 bg-white dark:bg-transparent">
            <span className="text-[10px] italic text-slate-300 dark:text-slate-600">Tidak ada data</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-700/30">
            {data.map((row, i) => (
              <div
                key={i}
                className="grid group/row hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors duration-150 bg-white dark:bg-transparent"
                style={{ gridTemplateColumns: "1fr 52px 44px 44px" }}
              >
                {/* Rank + Name */}
                <div className="flex items-center gap-1.5 px-2 py-1.5 min-w-0">
                  <span className="flex-shrink-0 w-4 h-4 rounded-sm bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center text-[7px] font-black text-slate-400 dark:text-slate-500">
                    {i + 1}
                  </span>
                  <span
                    className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 truncate leading-tight group-hover/row:text-slate-900 dark:group-hover/row:text-white transition-colors"
                    title={String(row[columns[0].key])}
                  >
                    {row[columns[0].key]}
                  </span>
                </div>

                {/* Numeric columns */}
                {columns.slice(1).map((col) => {
                  const value = row[col.key] ?? (col.key === "pctFcr" ? "0" : 0);
                  return (
                    <div key={col.key} className="flex items-center justify-center px-1 py-1.5">
                      {col.key === "pctFcr" ? (
                        <FcrBadge value={String(value)} />
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                          {Number(value).toLocaleString("id-ID")}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ChannelColumn({
  icon,
  title,
  sla,
  open,
  closed,
  topCorporateData,
  topKipData,
  isLoading = false,
}: ChannelColumnProps) {
  // ─── SKELETON ───
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2.5 animate-pulse">
        <div className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800/60" />
        <div className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800/50" />
        <div className="h-48 rounded-xl bg-slate-100 dark:bg-slate-800/40" />
        <div className="h-36 rounded-xl bg-slate-100 dark:bg-slate-800/30" />
      </div>
    );
  }

  const slaNum = parseFloat(sla);
  const isRed = slaNum < 75;
  const isYellow = slaNum >= 75 && slaNum <= 82;

  const slaColor = isRed
    ? "text-rose-500 dark:text-rose-400"
    : isYellow
    ? "text-amber-500 dark:text-amber-400"
    : "text-emerald-500 dark:text-emerald-400";

  const slaBoxBgClass = isRed
    ? "bg-rose-50 dark:bg-rose-950/25 border-rose-100/80 dark:border-rose-800/30"
    : isYellow
    ? "bg-amber-50 dark:bg-amber-950/25 border-amber-100/80 dark:border-amber-800/30"
    : "bg-emerald-50 dark:bg-emerald-950/25 border-emerald-100/80 dark:border-emerald-800/30";

  const slaLabelClass = isRed
    ? "text-rose-600/80 dark:text-rose-500"
    : isYellow
    ? "text-amber-600/80 dark:text-amber-500"
    : "text-emerald-600/80 dark:text-emerald-500";

  const slaIndicatorBgClass = isRed
    ? "bg-rose-500 shadow-[0_0_5px_2px_rgba(244,63,94,0.5)]"
    : isYellow
    ? "bg-amber-500 shadow-[0_0_5px_2px_rgba(245,158,11,0.5)]"
    : "bg-emerald-500 shadow-[0_0_5px_2px_rgba(16,185,129,0.5)]";

  // ─── REAL CONTENT ───
  return (
    <div className="flex flex-col h-full gap-2 bg-white dark:bg-[#1D293D] rounded-2xl border border-slate-200/80 dark:border-slate-700/40 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group">

      {/* ╔══ HEADER ══╗ */}
      <div className="relative flex items-center gap-2.5 px-3.5 py-2.5 bg-gradient-to-r from-slate-50 via-white to-slate-50/0 dark:from-slate-800/50 dark:via-slate-800/20 dark:to-transparent border-b border-slate-100 dark:border-slate-700/40">
        {/* Shimmer on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/60 dark:via-white/[0.04] to-transparent transition-opacity duration-700 pointer-events-none" />

        {/* Icon */}
        <div className="relative z-10 p-1.5 rounded-lg bg-white dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600/40 shadow-sm group-hover:scale-105 group-hover:-rotate-2 transition-transform duration-300">
          {icon}
        </div>

        {/* Title */}
        <span className="relative z-10 text-sm font-black tracking-tight text-slate-800 dark:text-white leading-none">
          {title}
        </span>
      </div>

      {/* ╔══ METRICS BAR ══╗ */}
      <div className="grid grid-cols-3 gap-1.5 px-3 pt-0.5">

        {/* SLA */}
        <div className={cn("group/m flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl border hover:-translate-y-0.5 transition-transform duration-200 cursor-default", slaBoxBgClass)}>
          <div className="flex items-center gap-1">
            <span className={cn("w-1 h-1 rounded-full animate-pulse", slaIndicatorBgClass)} />
            <span className={cn("text-[7.5px] font-black tracking-[0.2em] uppercase", slaLabelClass)}>SLA</span>
          </div>
          <span className={cn("text-[13px] font-black leading-none tabular-nums", slaColor)}>
            {sla}
          </span>
        </div>

        {/* Open */}
        <div className="group/m flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/25 border border-rose-100/80 dark:border-rose-800/30 hover:-translate-y-0.5 transition-transform duration-200 cursor-default">
          <div className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-rose-500 shadow-[0_0_5px_2px_rgba(244,63,94,0.5)]" />
            <span className="text-[7.5px] font-black tracking-[0.2em] uppercase text-rose-600/80 dark:text-rose-500">Open</span>
          </div>
          <span className="text-[13px] font-black leading-none tabular-nums text-rose-700 dark:text-rose-300">
            {open.toLocaleString("id-ID")}
          </span>
        </div>

        {/* Closed */}
        <div className="group/m flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/25 border border-sky-100/80 dark:border-sky-800/30 hover:-translate-y-0.5 transition-transform duration-200 cursor-default">
          <div className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-sky-500 shadow-[0_0_5px_2px_rgba(14,165,233,0.5)]" />
            <span className="text-[7.5px] font-black tracking-[0.2em] uppercase text-sky-600/80 dark:text-sky-500">Closed</span>
          </div>
          <span className="text-[13px] font-black leading-none tabular-nums text-sky-700 dark:text-sky-300">
            {closed.toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      {/* ╔══ TABLES ══╗ */}
      <div className="flex flex-col flex-1 gap-3 px-3 pb-3">
        <DataTable
          label="Top Corporate"
          accentColor="bg-violet-400"
          columns={corporateColumns}
          data={topCorporateData}
        />
        <DataTable
          label="Top KIP"
          accentColor="bg-sky-400"
          columns={kipColumns}
          data={topKipData}
        />
      </div>
    </div>
  );
}
