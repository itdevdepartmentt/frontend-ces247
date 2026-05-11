import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, IdCardLanyard } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types for Data Props ---
interface CorporateItem {
  nama_perusahaan: string;
  total: number;
}

export interface TopKipsCorporate {
  detail_category: string;
  inSla: number,
  outSla: number,
  total: number;
}

interface P1CorporateCardProps {
    isVip?: boolean;
  overSlaCount?: number;
  openCount?: number;
  topCorporates?: CorporateItem[];
  topKips?: TopKipsCorporate[];
}

export function CorporateCard({
    isVip = false,
  overSlaCount,
  openCount,
  topCorporates,
  topKips,
}: P1CorporateCardProps) {

  // Helper for the colored stat boxes (Blue >6H, Red Open)
  const StatBadge = ({ label, value, color }: { label: string; value: number; color: "blue" | "red" }) => (
    <div className={cn(
      "flex flex-col items-center justify-center rounded-md border text-white w-14 h-8 shadow-sm",
      color === "blue" ? "bg-[#0B1750] dark:bg-emerald-500 border-[#060d30] dark:border-emerald-600" : "bg-[#C20000] dark:bg-red-500 border-[#8a0000] dark:border-red-600"
    )}>
      <span className="text-[10px] font-semibold leading-none mb-0.5">{label}</span>
      <span className="text-xs font-bold leading-none">{value}</span>
    </div>
  );

  return (
    <Card className="w-full border border-border bg-card dark:bg-[#1D293D] text-card-foreground shadow-sm p-1">
      {/* Header Section */}
      <CardHeader className="flex flex-row items-start justify-between pt-2 px-4">
        <div className="flex flex-col gap-3">
          {/* Title Area */}
          <div className="flex items-center gap-2">
            {isVip ? (<IdCardLanyard className="h-6 w-6 text-orange-600" />) : (<Building2 className="h-6 w-6 text-sky-600" />)}
            <CardTitle className="text-sm font-medium text-foreground">
              {isVip ? "VIP Corporate" : "P1 Corporate & Others"}
            </CardTitle>
          </div>
          
          {/* Top Stats Row (>6H, Open) */}
          <div className="flex gap-2">
            <StatBadge label=">6H" value={overSlaCount ?? 0} color="blue" />
            <StatBadge label="Open" value={openCount ?? 0} color="red" />
          </div>
        </div>

        {/* Account Dropdown */}

      </CardHeader>

      <CardContent className="px-4 pb-2 -mt-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Top 10 Corp Open */}
          <div className="md:col-span-5 flex flex-col gap-3">
            {/* Header Pill */}
            <div className="rounded-full bg-muted py-1 px-4 text-center text-xs font-bold text-foreground shadow-sm">
              Top 10 Corp Open
            </div>
            {/* List */}
            <div className="flex flex-col text-[8pt] font-medium text-foreground">
              {topCorporates?.map((corp, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="truncate pr-2">{corp.nama_perusahaan}</span>
                  <span className="font-bold">{corp.total}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: Issues Breakdown */}
          <div className="md:col-span-7 flex flex-col gap-2">
            
            {/* Legend */}
            <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 bg-[#0B1750] dark:bg-emerald-500" />
                <span>IN SLA</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 bg-[#C20000] dark:bg-red-500" />
                <span>Out of SLA</span>
              </div>
            </div>

            {/* Chart List */}
            <div className="flex flex-col">
              {topKips?.map((issue, index) => (
                <div key={index} className="flex items-center justify-end gap-2 text-[8pt]">
                  {/* Label */}
                  <span className="text-right text-foreground truncate flex-1">
                    {issue.detail_category}
                  </span>

                  {/* Bars Container */}
                  <div className="flex items-center gap-1 min-w-[60px] justify-end">
                    {/* Blue Box (In SLA) - Only show if > 0 */}
                    {issue.inSla > 0 && (
                      <div className="flex h-4 items-center justify-center rounded-sm bg-[#0B1750] dark:bg-emerald-500 px-2 text-[8px] font-bold text-white shadow-sm min-w-[20px]">
                        {issue.inSla}
                      </div>
                    )}
                    
                    {/* Red Box (Out SLA) - Only show if > 0 OR if it's the only value? usually > 0 */}
                    {issue.outSla > 0 && (
                      <div 
                        className="flex h-4 items-center justify-center rounded-sm bg-[#C20000] dark:bg-red-500 px-2 text-[8px] font-bold text-white shadow-sm min-w-[20px]"
                        // Use width to visually simulate the bar length if desired, 
                        // but the image shows them mostly as boxes containing numbers.
                        // We can add a style to grow it slightly based on value if needed.
                        style={{ width: issue.outSla > 9 ? 'auto' : undefined }}
                      >
                        {issue.outSla}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </CardContent>
    </Card>
  );
}