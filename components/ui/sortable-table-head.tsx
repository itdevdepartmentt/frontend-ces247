import React from "react";
import { TableHead } from "@/components/ui/table";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableTableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  columnKey: string;
  currentSortBy?: string;
  currentSortOrder?: "asc" | "desc";
  onSort?: (key: string, order: "asc" | "desc") => void;
  children: React.ReactNode;
}

export function SortableTableHead({
  columnKey,
  currentSortBy,
  currentSortOrder,
  onSort,
  children,
  className,
  ...props
}: SortableTableHeadProps) {
  const isSorted = currentSortBy === columnKey;
  
  const handleSort = () => {
    if (!onSort) return;
    
    if (isSorted) {
      onSort(columnKey, currentSortOrder === "asc" ? "desc" : "asc");
    } else {
      onSort(columnKey, "asc");
    }
  };

  return (
    <TableHead 
      className={cn("cursor-pointer hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors group select-none", className)}
      onClick={handleSort}
      {...props}
    >
      <div className="flex items-center gap-1">
        {children}
        <div className="flex flex-col opacity-50 group-hover:opacity-100 transition-opacity ml-1">
          {isSorted ? (
            currentSortOrder === "asc" ? (
              <ChevronUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            )
          ) : (
            <ChevronsUpDown className="w-3.5 h-3.5" />
          )}
        </div>
      </div>
    </TableHead>
  );
}
