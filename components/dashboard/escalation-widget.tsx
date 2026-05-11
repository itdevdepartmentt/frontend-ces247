"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTable } from "./data-table"; // Path to your provided component
import { cn } from "@/lib/utils";
import { useEscalationData } from "@/hooks/use-escalation-data";
import { DataTableEscalation } from "./data-table-escalation";

// --- TYPES ---
interface EscalationSummary {
  open: number;
  over3h: number;
}

interface EscalationCardProps {
  title: string;
  type: "ebo" | "gtm" | "billco" | "it";
  apiUrl: string;
  columns: { key: string; label: string }[];
  className?: string;
  dateRange?: {
    from?: string;
    to?: string;
  };
}

export function EscalationCard({
  title,
  type,
  apiUrl,
  columns,
  className,
  dateRange,
}: EscalationCardProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const safeDateRange =
    dateRange?.from && dateRange?.to
      ? { from: dateRange.from, to: dateRange.to }
      : undefined;

  const { data, isLoading } = useEscalationData({
    apiUrl,
    page,
    search,
    dateRange: safeDateRange,
  });

  // Fallback values if data hasn't arrived yet
  const list = data?.data || [];
  const summary = data?.summary || { totalOpen: 0, over3H: 0 };
  const totalPages = data?.meta?.totalPages || 1;

  // --- 1. Smart Pagination Logic ---
  const getPaginationItems = () => {
    const items: (number | string)[] = [];

    // Always show fewer items on mobile (optional tweak)
    const siblingCount = 1;

    // Case: Total pages are small (<= 7), just show them all
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Always include first page
    items.push(1);

    // Calculate start and end of "window" around current page
    const startPage = Math.max(2, page - siblingCount);
    const endPage = Math.min(totalPages - 1, page + siblingCount);

    // Add left ellipsis if needed
    if (startPage > 2) {
      items.push("..."); // represent gap
    }

    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      items.push(i);
    }

    // Add right ellipsis if needed
    if (endPage < totalPages - 1) {
      items.push("..."); // represent gap
    }

    // Always include last page
    if (totalPages > 1) {
      items.push(totalPages);
    }

    return items;
  };

  // 2. Navigation Handlers (trigger parent update)
  const handleNext = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const handlePrev = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };
  return (
    <div
      className={cn(
        "flex flex-col bg-[#F1F3F4] dark:bg-[#1D293D] p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700",
        className,
      )}
    >
      {/* Header Section */}
      <div className="flex justify-between items-start mb-1">
        <div>
          <h2 className="text-md font-black text-red-600 dark:text-red-500 tracking-tight leading-none mb-4">
            {title}
          </h2>
          <div className="flex gap-2">
            {/* Open Stat */}
            <div className="bg-[#C00000] text-white rounded-lg p-2 px-2 text-center">
              <p className="text-[10px] font-bold leading-tight uppercase">
                Open
              </p>
              <p className="text-sm font-black leading-none">
                {summary.totalOpen}
              </p>
            </div>
            {/* >3H Stat */}
            <div className="bg-[#000033] text-white rounded-lg p-2 px-2 text-center">
              <p className="text-[10px] font-bold leading-tight">{">3H"}</p>
              <p className="text-sm font-black leading-none">
                {summary.over3H}
              </p>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-[10px] font-bold text-slate-900 dark:text-slate-200 mr-1">
            Ticket Search
          </span>
          <div className="relative group">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-blue-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-6 w-35 pl-7 pr-2 rounded border border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-900 text-black dark:text-white text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <Button
            variant="ghost"
            className="h-5 w-35 bg-[#D1D5DB] dark:bg-slate-700 hover:bg-[#BEC3C9] dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-[10px] font-bold shadow-sm justify-between px-2 rounded"
          >
            SLA Filter
            <Filter className="h-3 w-3 fill-slate-500 dark:fill-slate-400 text-slate-500 dark:text-slate-400" />
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="relative mb-4 mt-2">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 rounded-md">
            <Loader2 className="h-6 w-6 animate-spin text-red-600" />
          </div>
        )}
        <DataTableEscalation title="" data={list} columns={columns} />
      </div>

      {/* Footer / Pagination Section */}
      <div className="flex items-center justify-end -mt-2 gap-2">
        <span className="text-[11px] font-black text-slate-900 dark:text-slate-200 mr-1">Page</span>
        <div className="flex gap-1">
          {/* Loop through the Smart Pagination Items */}
          {getPaginationItems().map((item, index) => (
            <React.Fragment key={index}>
              {item === "..." ? (
                // Render Ellipsis
                <span className="px-2 text-slate-400 text-xs">...</span>
              ) : (
                // Render Page Button
                <Button
                  size="sm"
                  onClick={() => setPage(item as number)}
                  className={cn(
                    "h-7 w-7 rounded-none p-0 text-xs transition-colors",
                    page === item
                      ? "bg-[#C20000] text-white hover:bg-[#a00000]"
                      : "bg-gray-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-gray-400 dark:hover:bg-slate-600",
                  )}
                >
                  {item}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Nav Arrows */}
        <div className="flex gap-1 ml-1">
          <button
            className="h-6 w-6 rounded-full border-2 border-slate-900 dark:border-slate-400 flex items-center justify-center text-slate-900 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            onClick={handlePrev}
          >
            <ChevronLeft className="h-4 w-4 stroke-[3px]" />
          </button>
          <button
            className="h-6 w-6 rounded-full border-2 border-slate-900 dark:border-slate-400 flex items-center justify-center text-slate-900 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            onClick={handleNext}
          >
            <ChevronRight className="h-4 w-4 stroke-[3px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
