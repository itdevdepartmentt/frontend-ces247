"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HandHeart, Network, Smartphone } from "lucide-react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { cn } from "@/lib/utils";
import { ProductDetail } from "@/types/dashboard";

interface ProductDetailProps {
  product: String;
  data: ProductDetail;
  isLoading?: boolean; // <--- NEW PROP
  className?: string;
}

export function ProductCard({
  product,
  data,
  isLoading = false,
  className,
}: ProductDetailProps) {
  // 1. SKELETON RENDER (Shows when isLoading is true)
  if (isLoading) {
    return (
      <Card
        className={cn(
          "w-full max-w-4xl border-none shadow-sm bg-gray-50/50 dark:bg-slate-900/50",
          className,
        )}
      >
        <CardHeader className="flex flex-row items-center gap-2">
          {/* Icon Skeleton */}
          <div className="h-6 w-6 rounded-full bg-slate-200 animate-pulse" />
          {/* Title Skeleton */}
          <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
        </CardHeader>

        <CardContent className="space-y-4 -mx-4 -mt-2">
          {/* TOP SECTION SKELETON */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700/50">
            <div className="flex gap-4 mb-4">
              <div className="h-12 w-24 bg-slate-100 dark:bg-slate-700 rounded-md animate-pulse" />
              <div className="h-12 w-24 bg-slate-100 dark:bg-slate-700 rounded-md animate-pulse" />
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-2 items-center">
                  <div className="h-3 w-24 bg-slate-100 dark:bg-slate-700 rounded animate-pulse ml-auto" />
                  <div className="h-5 w-full max-w-[200px] bg-slate-200 dark:bg-slate-600 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* MIDDLE SECTION SKELETON */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700/50">
            <div className="flex justify-between mb-4">
              <div className="flex gap-2">
                <div className="h-10 w-16 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                <div className="h-10 w-16 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
              </div>
              <div className="h-8 w-32 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
            </div>
            <div className="h-[180px] w-full bg-slate-50 dark:bg-slate-700/50 rounded animate-pulse" />
          </div>

          {/* BOTTOM SECTION SKELETON */}
          <div className="rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="h-10 bg-slate-200 dark:bg-slate-700 animate-pulse w-full" />
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-8 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 animate-pulse"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // 2. REAL RENDER (Existing Logic)
  const connectivityData = data;

  if (!connectivityData) return <div>No Connectivity Data Found</div>;

  const chartData = useMemo(() => {
    return connectivityData.trend.map((item) => ({
      name: parseInt(item.date.split("-")[2]).toString(),
      total: item.total,
      sla: parseFloat(item.dailySla),
    }));
  }, [connectivityData.trend]);

  const maxCategoryTotal =
    Math.max(...connectivityData.topCategories.map((c) => c.total)) || 1; // Prevent division by zero

  return (
    <Card
      className={cn("w-full bg-card dark:bg-[#1D293D] text-card-foreground border-border shadow-sm rounded-xl overflow-hidden", className)}
    >
      <CardHeader className="flex flex-row items-center gap-2">
        {getProductIcon(product)}{" "}
        <CardTitle className="text-md font-bold text-slate-900 dark:text-slate-100">
          {product} Detail
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 -mx-4 -mt-2">
        {/* --- TOP SECTION: Categories Breakdown --- */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100/50 dark:border-slate-700/50">
          <div className="flex gap-4 mb-4">
            <div className="bg-gray-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                Total Ticket
              </span>
              <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
                {connectivityData.total.toLocaleString("id-ID")}
              </span>
            </div>
            {(() => {
              const allSlaVal = parseFloat(connectivityData.pctSla);
              const allSlaStyles = allSlaVal < 75
                ? "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30 text-rose-700 dark:text-rose-400"
                : allSlaVal <= 82
                ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-400"
                : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400";
              return (
                <div className={cn("px-3 py-1.5 rounded-md border transition-colors", allSlaStyles)}>
                  <span className="text-xs font-bold block mb-0.5 opacity-90">%SLA ALL</span>
                  <span className="text-sm font-extrabold">{connectivityData.pctSla}%</span>
                </div>
              );
            })()}
          </div>

          <div className="grid grid-cols-8 gap-1 text-xs mt-2">
            <div className="col-span-4 text-right font-bold text-slate-700"></div>
            <div className="col-span-2 font-bold text-slate-900 dark:text-slate-300 tracking-wide text-[10px] uppercase">
              Total Ticket
            </div>
            <div className="col-span-2 font-bold text-slate-900 dark:text-slate-300 tracking-wide text-[10px] uppercase">%SLA</div>

            {connectivityData.topCategories.map((cat, idx) => (
              <React.Fragment key={idx}>
                <div className="col-span-4 flex items-center justify-end text-right text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase pr-3 tracking-wider">
                  {cat.general_category}
                </div>
                <div className="col-span-2 flex items-center">
                  <div
                    className="h-4 bg-[#0B1750] dark:bg-sky-500/80 rounded-sm transition-all duration-500"
                    style={{
                      width: `${(cat.total / maxCategoryTotal) * 80}%`,
                      minWidth: "4px",
                    }}
                  />
                  <span className="ml-2 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    {cat.total}
                  </span>
                </div>
                <div className="col-span-2 flex items-center">
                  {(() => {
                    const catSlaVal = parseFloat(cat.catSla);
                    const progressBgClass = catSlaVal < 75
                      ? "bg-rose-500/80 dark:bg-rose-600/70"
                      : catSlaVal <= 82
                      ? "bg-amber-400/80 dark:bg-amber-500/70"
                      : "bg-emerald-500/80 dark:bg-emerald-600/70";
                    return (
                      <div
                        className={cn("h-4 rounded-sm transition-all duration-500", progressBgClass)}
                        style={{ width: `${catSlaVal}%` }}
                      />
                    );
                  })()}
                  <span className="ml-2 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    {cat.catSla}%
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* --- MIDDLE SECTION: Trend Chart --- */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm relative border border-slate-100/50 dark:border-slate-700/50">
          <div className="flex justify-between items-start mb-6">
            <div className="flex gap-2">
              <div className="bg-[#0B1750] dark:bg-slate-700/80 border border-transparent dark:border-slate-600 text-white px-4 py-2 rounded-lg text-center min-w-[70px] shadow-sm">
                <div className="text-[10px] font-bold tracking-wider uppercase text-slate-300">Open</div>
                <div className="text-sm font-black">{connectivityData.open}</div>
              </div>
              <div className="bg-[#0B1750] dark:bg-slate-700/80 border border-transparent dark:border-slate-600 text-white px-4 py-2 rounded-lg text-center min-w-[70px] shadow-sm">
                {product === "Connectivity" || product === "DAds" ? (
                  <div className="text-[10px] font-bold tracking-wider uppercase text-slate-300">&gt;3H</div>
                ) : (
                  <div className="text-[10px] font-bold tracking-wider uppercase text-slate-300">&gt;6H</div>
                )}

                <div className="text-sm font-black">
                  {connectivityData.over3h}
                </div>
              </div>
            </div>

            {/* <div className="w-[150px]">
              <Select defaultValue="product">
                <SelectTrigger className="h-8 bg-gray-100 border-none">
                  <SelectValue placeholder="Product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Product</SelectItem>
                </SelectContent>
              </Select>
            </div> */}
          </div>
          <div className="h-[200px] w-full text-xs -mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 0, bottom: 20, left: 0 }}
              >
                <CartesianGrid stroke="#f5f5f5" vertical={false} />
                <XAxis
                  dataKey="name"
                  // scale="point"
                  padding={{ left: 10, right: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                />
                <YAxis
                  yAxisId="left"
                  hide
                  domain={[0, (dataMax: number) => dataMax * 2.5]}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  hide
                  domain={[0, 120]}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "sla") {
                      return [`${value}%`, "SLA"];
                    }
                    return [value, name];
                  }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  labelStyle={{ color: "#374151", fontWeight: "bold" }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="total"
                  fill="currentColor"
                  className="text-[#0B1750] dark:text-sky-500"
                  barSize={10}
                  radius={[2, 2, 0, 0]}
                >
                  <LabelList
                    dataKey="total"
                    position="top"
                    style={{
                      fill: "#374151",
                      fontSize: "9px",
                      fontWeight: "bold",
                    }}
                  />
                </Bar>
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="sla"
                  stroke="#9ca3af"
                  strokeWidth={3}
                  dot={{ r: 3, fill: "#9ca3af", strokeWidth: 0 }}
                >
                  {/* <LabelList
                    dataKey="sla"
                    position="top"
                    offset={10}
                    formatter={(val: any) => `${val}%`}
                    style={{ fill: "#6b7280", fontSize: "8px" }}
                  /> */}
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 -mt-6">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-1 bg-[#0B1750] dark:bg-sky-500 rounded-full"></div>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">Total</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-1 bg-gray-400 dark:bg-slate-500 rounded-full"></div>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">SLA</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- BOTTOM SECTION: Top KIP Table --- */}
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700/80 shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-gray-200 dark:border-slate-700/80">
              <tr>
                <th className="px-4 py-2.5 font-bold text-[10px] uppercase tracking-wider">Top KIP</th>
                <th className="px-4 py-2.5 font-bold text-center text-[10px] uppercase tracking-wider">
                  Total Tiket
                </th>
                <th className="px-4 py-2.5 font-bold text-center text-[10px] uppercase tracking-wider">%SLA</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-gray-100 dark:divide-slate-700/50 bg-white dark:bg-slate-900/30">
              {connectivityData.topKips.map((kip, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <td
                    className="px-4 py-2 text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate max-w-[200px]"
                    title={kip.detail_category}
                  >
                    {kip.detail_category}
                  </td>
                  <td className="px-4 py-2 text-[11px] text-center font-bold text-slate-800 dark:text-slate-200">
                    {kip.total}
                  </td>
                  <td className="px-4 py-2 text-center align-middle">
                    <span
                      className={cn(
                        "inline-flex items-center justify-center font-black text-[9px] px-1.5 py-0.5 rounded-md tabular-nums",
                        parseFloat(kip.kipSla) < 75
                          ? "bg-rose-500/15 text-rose-500 dark:text-rose-400 ring-1 ring-rose-500/30"
                          : parseFloat(kip.kipSla) <= 82
                          ? "bg-amber-500/15 text-amber-500 dark:text-amber-400 ring-1 ring-amber-500/30"
                          : "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 ring-1 ring-emerald-500/30"
                      )}
                    >
                      {kip.kipSla}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

const getProductIcon = (productName: String) => {
  const normalized = productName.toLowerCase();

  if (normalized.includes("connectivity")) {
    return <Network className="h-6 w-6 text-sky-500" />;
  }
  if (normalized.includes("solution")) {
    return <HandHeart className="h-6 w-6 text-emerald-500" />;
  }
  if (normalized.includes("ads") || normalized.includes("dads")) {
    return <Smartphone className="h-6 w-6 text-orange-500" />;
  }

  // Default fallback
  return <Network className="h-6 w-6 text-slate-500" />;
};
