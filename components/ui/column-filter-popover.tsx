import React, { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListFilter, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const emptyArray: string[] = [];

interface ColumnFilterPopoverProps {
  columnKey: string;
  columnLabel: string;
  columnFilters: Record<string, string[]>;
  setColumnFilters: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  options: string[];
}

export function ColumnFilterPopover({
  columnKey,
  columnLabel,
  columnFilters,
  setColumnFilters,
  options,
}: ColumnFilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const currentFilterValue = columnFilters[columnKey] || emptyArray;
  const [tempSelected, setTempSelected] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setTempSelected(currentFilterValue);
      setSearchVal("");
    }
  }, [open, currentFilterValue]);

  const filteredOptions = React.useMemo(() => {
    if (!searchVal) return options;
    return options.filter((opt) => opt.toLowerCase().includes(searchVal.toLowerCase()));
  }, [options, searchVal]);

  const hasActiveFilter = currentFilterValue.length > 0;

  const handleApply = () => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      if (tempSelected.length === 0) {
        delete next[columnKey];
      } else {
        next[columnKey] = tempSelected;
      }
      return next;
    });
    setOpen(false);
  };

  const handleClear = () => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      delete next[columnKey];
      return next;
    });
    setTempSelected([]);
    setOpen(false);
  };

  const toggleOption = (opt: string) => {
    setTempSelected((prev) =>
      prev.includes(opt) ? prev.filter((item) => item !== opt) : [...prev, opt]
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-5 w-5 ml-1.5 p-0 rounded-sm transition-colors ${
            hasActiveFilter
              ? "text-indigo-600 hover:text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30"
              : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          }`}
        >
          <ListFilter className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-md rounded-xl z-50 text-zinc-900 dark:text-zinc-100" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Filter {columnLabel}
            </span>
            {hasActiveFilter && (
              <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px] text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50" onClick={handleClear}>
                Clear
              </Button>
            )}
          </div>
          <Input
            placeholder="Search..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="h-8 text-xs bg-zinc-50 dark:bg-zinc-900"
          />
          <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="text-xs text-zinc-500 text-center py-2">No options found</div>
            ) : (
              filteredOptions.map((opt) => (
                <label 
                  key={opt} 
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer text-xs transition-colors group"
                  onClick={(e) => { e.preventDefault(); toggleOption(opt); }}
                >
                  <div className={cn(
                    "w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors",
                    tempSelected.includes(opt) 
                      ? "bg-indigo-600 border-indigo-600 text-white" 
                      : "border-zinc-300 dark:border-zinc-700 group-hover:border-indigo-400"
                  )}>
                    {tempSelected.includes(opt) && <CheckCircle2 className="w-2.5 h-2.5" />}
                  </div>
                  <span className="truncate flex-1">{opt}</span>
                </label>
              ))
            )}
          </div>
          <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" className="flex-1 h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleApply}>Apply</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
