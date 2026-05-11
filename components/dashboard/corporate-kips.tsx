import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CompanyKips } from "@/types/dashboard";

// --- Types ---
interface SubItem {
  label: string;
  percentage: number;
}

interface CorporateSlaItem {
  companyName: string;
  totalPercentage: number;
  items: SubItem[];
}

interface SlaCustomerKipProps {
  data?: CompanyKips[];
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  isLoading?: boolean;
  // Pagination Props
  currentPage: number;
  itemsPerPage: number;
  totalItems: number; // Required to calculate total pages
  onPageChange: (page: number) => void;
}

// --- Sample Data ---
const DEFAULT_DATA: CompanyKips[] = [
  {
    company: "PT. SUPER SPRING",
    totalTickets: 90,
    companySla: "85.00",
    topKips: [
      {
        detail_category: "Kendala penggunaan kartu SIM",
        kip_count: 100,
        kip_sla: "100.00",
        rn: 1,
      },
      {
        detail_category: "Informasi sisa kuota",
        kip_count: 100,
        kip_sla: "100.00",
        rn: 2,
      },
      {
        detail_category: "Re-aktivasi",
        kip_count: 58,
        kip_sla: "58.57",
        rn: 3,
      },
    ],
  },
];

export function SlaCustomerKipCard({
  data = DEFAULT_DATA,
  searchTerm = "",
  onSearchChange,
  isLoading = false,
  currentPage,
  itemsPerPage,
  totalItems,
  onPageChange,
}: SlaCustomerKipProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  7;
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
    const startPage = Math.max(2, currentPage - siblingCount);
    const endPage = Math.min(totalPages - 1, currentPage + siblingCount);

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
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  // const handlePageClick = (pageNumber: number) => {
  //   setCurrentPage(pageNumber);
  // };

  const ProgressBar = ({
    value,
    isMain,
  }: {
    value: number;
    isMain: boolean;
  }) => {
    const isSmall = value < 25;

    return (
      <div className="relative w-[120px] sm:w-[150px] h-4 sm:h-5 bg-muted rounded-sm overflow-hidden">
        {/* Progress bar */}
        <div
          className={cn(
            "h-full transition-all duration-500 relative",
            isMain ? "bg-[#0B1750] dark:bg-emerald-500" : "bg-[#2b6cb0] dark:bg-emerald-400",
          )}
          style={{ width: `${value}%` }}
        >
          {/* Label INSIDE bar */}
          {!isSmall && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white whitespace-nowrap">
              {value.toLocaleString("id-ID", { minimumFractionDigits: 2 })}%
            </span>
          )}
        </div>

        {/* Label OUTSIDE bar */}
        {isSmall && (
          <span className="absolute left-1 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 whitespace-nowrap">
            {value.toLocaleString("id-ID", { minimumFractionDigits: 2 })}%
          </span>
        )}
      </div>
    );
  };

  // React.useEffect(() => {
  //   setCurrentPage(1);
  // }, [data, searchTerm]);

  return (
    <Card className="w-full border border-border bg-card dark:bg-[#1D293D] text-card-foreground shadow-sm">
      {/* Header with Search */}
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6">
        <CardTitle className="text-md font-bold text-red-600">
          SLA Customer to KIP
        </CardTitle>
        <div className="flex flex-col gap-1 w-full sm:w-auto mt-2 sm:mt-0">
          <label className="text-xs font-bold text-foreground ml-1">
            Corp Search
          </label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500" />
            <Input
              className="h-7 w-full sm:w-[200px] bg-background border-input text-foreground pl-7 text-xs"
              placeholder=""
              value={searchTerm}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      ) : (
        <CardContent className="px-6">
          <div className="flex flex-col space-y-2 min-h-[200px]">
            {/* Loop through currentItems instead of all data */}
            {data.map((corp, index) => (
              <div
                key={index}
                className="flex flex-col border-b border-border pb-2 last:border-0 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                {/* Main Corporate Row */}
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-foreground truncate pr-4">
                    {corp.company}
                  </span>
                  <ProgressBar
                    value={parseFloat(corp.companySla)}
                    isMain={true}
                  />
                </div>

                {/* Sub Items */}
                <div className="flex flex-col gap-1">
                  {corp.topKips.map((item, subIndex) => (
                    <div
                      key={subIndex}
                      className="flex items-center justify-between pl-4"
                    >
                      <span className="text-[8pt] text-muted-foreground truncate pr-4 bg-muted/50 rounded-sm px-1">
                        {item.detail_category}
                      </span>
                      <ProgressBar
                        value={parseFloat(item.kip_sla)}
                        isMain={false}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* --- 2. UPDATED Footer Pagination --- */}
          <div className="mt-6 flex items-center justify-center gap-2 select-none">
            <span className="text-sm font-bold text-foreground mr-2">Page</span>

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
                    onClick={() => onPageChange(item as number)}
                    className={cn(
                      "h-7 w-7 rounded-none p-0 text-xs transition-colors",
                      currentPage === item
                        ? "bg-[#C20000] text-white hover:bg-[#a00000]"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                    )}
                  >
                    {item}
                  </Button>
                )}
              </React.Fragment>
            ))}

            {/* Navigation Arrows */}
            <div className="flex gap-1 ml-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrev}
                disabled={currentPage === 1}
                className="h-7 w-7 rounded-full border-2 border-primary p-0 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-secondary transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-primary" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                disabled={currentPage >= totalPages}
                className="h-7 w-7 rounded-full border-2 border-primary p-0 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-secondary transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-primary" />
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
