"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  AlertCircle,
  Inbox,
} from "lucide-react";
import { usePriorityTickets } from "@/hooks/use-priority-tickets";
import { PriorityType } from "@/types/dashboard";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

// ─── Label map ───────────────────────────────────────────────
const PRIORITY_LABELS: Record<PriorityType, string> = {
  roaming: "Roaming",
  extra: "Extra Quota",
  vip: "VIP",
  pareto: "P1 (Pareto)",
  urgent: "Urgent",
  cc: "CC",
};

// ─── Props ───────────────────────────────────────────────────
interface PriorityTicketModalProps {
  type: PriorityType | null;
  isOpen: boolean;
  onClose: () => void;
  dateRange?: { from?: string; to?: string };
}

// ─── Component ───────────────────────────────────────────────
export function PriorityTicketModal({
  type,
  isOpen,
  onClose,
  dateRange,
}: PriorityTicketModalProps) {
  const [page, setPage] = React.useState(1);
  const [searchInput, setSearchInput] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  // Reset state when a different type is selected
  React.useEffect(() => {
    setPage(1);
    setSearchInput("");
    setDebouncedSearch("");
  }, [type]);

  // Debounce search input (300ms)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1); // reset to page 1 on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError } = usePriorityTickets({
    type,
    dateRange,
    page,
    limit: 10,
    search: debouncedSearch,
  });

  const tickets = data?.data ?? [];
  const meta = data?.meta;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        {/* ─── Header ────────────────────────────────── */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              Detail Priority —{" "}
              <span className="text-red-500">
                {type ? PRIORITY_LABELS[type] : ""}
              </span>
              {meta && !isLoading && (
                <Badge
                  variant="secondary"
                  className="ml-1 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-normal"
                >
                  {meta.total.toLocaleString()} ticket
                  {meta.total !== 1 ? "s" : ""}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Unresolved tickets with{" "}
              <strong>{type ? PRIORITY_LABELS[type] : ""}</strong> priority in
              the selected date range.
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by ticket ID, customer, or subject…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {/* ─── Body (Scrollable) ─────────────────────── */}
        <div className="flex-1 overflow-auto px-6 py-4 min-h-[300px]">
          {isLoading ? (
            <LoadingSkeleton />
          ) : isError ? (
            <ErrorState />
          ) : tickets.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10">
                  <tr>
                    {[
                      "Ticket ID",
                      "Customer",
                      "Subject",
                      "Channel",
                      "Status",
                      "Priority",
                      "Created At",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {tickets.map((t, idx) => (
                    <tr
                      key={`${t.ticketNumber}-${idx}`}
                      className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-3 py-2.5 font-mono text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {t.ticketNumber}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 max-w-[160px] truncate">
                        {t.customerName ?? (
                          <span className="italic text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 max-w-[220px]">
                        {t.subject ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help block truncate">{t.subject}</span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[320px] bg-slate-950 text-slate-200 border border-slate-800 p-2.5 text-xs rounded-md shadow-xl whitespace-normal break-words">
                              {t.subject}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="italic text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className="text-xs font-normal capitalize"
                        >
                          {t.channel ?? "—"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {t.priority ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(t.createdAt).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ─── Pagination Footer ─────────────────────── */}
        {meta && meta.totalPages > 1 && !isLoading && (
          <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-3 flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">
              Page {meta.page} of {meta.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 px-3"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 px-3"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function StatusBadge({ status }: { status: string | null }) {
  const s = (status ?? "").toLowerCase();
  const isOpen = !s.includes("close") && !s.includes("resolve");

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isOpen
          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
          : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isOpen ? "bg-amber-500" : "bg-green-500"
        }`}
      />
      {status ?? "Unknown"}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-28" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
      <Inbox className="h-12 w-12 mb-3 opacity-50" />
      <p className="text-sm font-medium">No tickets found</p>
      <p className="text-xs mt-1">
        Try adjusting your search or date range filter.
      </p>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-red-400 dark:text-red-500">
      <AlertCircle className="h-12 w-12 mb-3 opacity-50" />
      <p className="text-sm font-medium">Failed to load tickets</p>
      <p className="text-xs mt-1">
        Please try again or contact your administrator.
      </p>
    </div>
  );
}
