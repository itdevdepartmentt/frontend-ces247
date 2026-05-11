"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardSummary, PriorityType } from "@/types/dashboard";
import { PriorityTicketModal } from "./priority-ticket-modal";

interface LeftColumnProps {
  summary?: DashboardSummary;
  dateRange?: { from?: string; to?: string };
}

export function LeftColumn({ summary, dateRange }: LeftColumnProps) {
  const [selectedPriority, setSelectedPriority] =
    React.useState<PriorityType | null>(null);

  if (!summary) {
    return (
      <div className="flex flex-col gap-4">
        <div className="animate-pulse bg-slate-800 h-48 rounded-xl border border-slate-700" />
        <div className="animate-pulse bg-slate-800 h-64 rounded-xl border border-slate-700" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:col-span-1 gap-4 mb-4 lg:mb-0">
      <Card className="bg-red-100/50 border-red-200  dark:bg-red-900/20 dark:border-red-900/50 text-center">
        <CardHeader className="pb-2 py-4">
          <CardTitle className="text-2xl font-bold text-red-500">
            {summary.totalTickets.toLocaleString()}
          </CardTitle>
          <p className="text-sm font-medium dark:text-slate-300">
            Total Tickets
          </p>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 pt-4 border-t border-red-900/50">
          <div>
            <div className="text-lg font-bold text-red-500">
              {summary.totalOpen.toLocaleString()}
            </div>
            <p className="text-xs dark:text-slate-400">Open</p>
          </div>
          <div>
            <div className="text-lg font-bold text-green-500">
              {summary.totalClosed.toLocaleString()}
            </div>
            <p className="text-xs dark:text-slate-400">Closed</p>
          </div>
        </CardContent>
      </Card>

      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardHeader className="pb-2 bg-red-600 dark:bg-red-900/50">
          <CardTitle className="text-xs font-medium text-center pt-4">
            Priority (Unresolved)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 justify-items-center gap-1 p-2 -mt-4">
          <BadgePriority
            label="Roaming"
            value={summary?.priority?.roaming ?? 0}
            onClick={() => setSelectedPriority("roaming")}
          />
          <BadgePriority
            label="Extra Quota"
            value={summary?.priority?.extra ?? 0}
            onClick={() => setSelectedPriority("extra")}
          />
          <BadgePriority
            label="CC"
            value={0}
            onClick={() => setSelectedPriority("cc")}
          />
          <BadgePriority
            label="VIP"
            value={summary?.priority?.vip ?? 0}
            onClick={() => setSelectedPriority("vip")}
          />
          <BadgePriority
            label="P1"
            value={summary?.priority?.pareto ?? 0}
            onClick={() => setSelectedPriority("pareto")}
          />
          <BadgePriority
            label="Urgent"
            value={summary?.priority?.urgent ?? 0}
            onClick={() => setSelectedPriority("urgent")}
          />
        </CardContent>
      </Card>

      {/* Priority Detail Modal */}
      <PriorityTicketModal
        type={selectedPriority}
        isOpen={selectedPriority !== null}
        onClose={() => setSelectedPriority(null)}
        dateRange={dateRange}
      />
    </div>
  );
}

// ─── Badge Sub-component ─────────────────────────────────────

interface BadgePriorityProps {
  label: string;
  value: number;
  onClick?: () => void;
  disabled?: boolean;
}

function BadgePriority({ label, value, onClick, disabled }: BadgePriorityProps) {
  return (
    <Badge
      variant="secondary"
      onClick={disabled ? undefined : onClick}
      className={`
        bg-red-500 hover:bg-red-500/90 dark:bg-red-600 dark:hover:bg-red-600/90
        flex flex-col items-center py-1 rounded-md h-12 w-16
        transition-all duration-150
        ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer hover:scale-105 hover:shadow-lg hover:shadow-red-500/20 active:scale-95"
        }
      `}
    >
      <span className="text-xs font-normal">{label}</span>
      <span className="text-md font-bold">{value}</span>
    </Badge>
  );
}
