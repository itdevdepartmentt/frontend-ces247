"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, TrendingDown, AlertCircle } from "lucide-react";
import { MetricCard } from "./metric-card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DashboardSummary } from "@/types/dashboard";
import { CsatMetricCard } from "./csat-metric-card";

const dailyTrendData = [
  { date: "1", value: 1000 },
  { date: "3", value: 1200 },
  { date: "5", value: 800 },
];

const ticketsPerHourData = [
  { name: "00:00", created: 8, solved: 6 },
  { name: "03:00", created: 9, solved: 5 },
  { name: "06:00", created: 12, solved: 8 },
  { name: "09:00", created: 15, solved: 10 },
  { name: "12:00", created: 10, solved: 7 },
  { name: "15:00", created: 11, solved: 9 },
  { name: "18:00", created: 4, solved: 3 },
  { name: "21:00", created: 2, solved: 1 },
];

interface TopRowProps {
  summary?: DashboardSummary;
}

export function TopRow({ summary }: TopRowProps) {
  // Add this before your return statement
  const trendData = summary?.dailyTrend || [];
  const hasTrendData = trendData.length > 1;

  // Get the values safely
  const todayValue = hasTrendData ? trendData[trendData.length - 1].value : 0;
  const yesterdayValue = hasTrendData
    ? trendData[trendData.length - 2].value
    : 0;

  const todaySla = hasTrendData ? trendData[trendData.length - 1].sla : "0";
  const yesterdaySla = hasTrendData ? trendData[trendData.length - 2].sla : "0";

  // Calculate the difference
  const trendDiff = todayValue - yesterdayValue;
  const trendDirection = trendDiff >= 0 ? "up" : "down";

  const slaDiff = parseFloat(todaySla) - parseFloat(yesterdaySla);
  const slaDirection = slaDiff >= 0 ? "up" : "down";

  const currentSlaVal = summary ? parseFloat(summary.slaPercentage) : 0;
  const isRed = summary && currentSlaVal < 75;
  const isYellow = summary && currentSlaVal >= 75 && currentSlaVal <= 82;

  const cardSlaBgClass = isRed
    ? "bg-red-100/50 border-red-200 dark:bg-red-900/20 dark:border-red-900/50"
    : isYellow
    ? "bg-amber-100/50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900/50"
    : "bg-green-100/50 border-green-200 dark:bg-green-900/20 dark:border-green-900/50";

  const cardSlaTextClass = isRed
    ? "text-red-600 dark:text-red-500"
    : isYellow
    ? "text-amber-600 dark:text-amber-500"
    : "text-green-600 dark:text-green-500";

  const cardSlaIcon = isRed ? (
    <TrendingDown className="h-6 w-6 text-red-500" />
  ) : isYellow ? (
    <AlertCircle className="h-6 w-6 text-amber-500" />
  ) : (
    <CheckCircle className="h-6 w-6 text-green-500" />
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-6 2xl:grid-cols-32 gap-4 mb-4">
      <MetricCard
        title="SLA Today"
        value={summary ? `${summary.slaPercentage}%` : "..."}
        subtitle="Achieved"
        trend={{ value: `${slaDiff.toFixed(2)}%`, direction: slaDirection }}
        icon={cardSlaIcon}
        className={`${cardSlaBgClass} lg:col-span-1 2xl:col-span-4 transition-colors`}
        contentClassName={cardSlaTextClass}
      />

      <Card className="dark:bg-slate-800 dark:border-slate-700 col-span-1 lg:col-span-2 2xl:col-span-7">
        <CardHeader className="pb-2 -m-2">
          <CardTitle className="text-sm font-medium dark:text-slate-300">
            Daily Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pb-0 pt-0 -m-4">
          <div className="h-[80px] overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary?.dailyTrend} className="-ml-6">
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--chart-tooltip)",
                    border: "var(--chart-tooltip-border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: "var(--chart-tooltip-text)" }}
                />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={8}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(date) => `${date.split("-")[2]}`}
                />
                <YAxis
                  stroke="#94a3b8"
                  padding={{ top: 0, bottom: 0 }}
                  fontSize={8}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
                {/* <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} /> */}
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* <p className="text-xs text-center text-slate-400 mt-1">
            Ticket Trend
          </p> */}
        </CardContent>
      </Card>

      <Card className="dark:bg-slate-800 dark:border-slate-700 col-span-1 lg:col-span-3 2xl:col-span-9 pb-0">
        <CardHeader className="pb-2 -m-2 flex flex-row items-center justify-between gap-4 space-y-0">
          {/* 1. Title Section */}
          <CardTitle className="text-sm font-medium dark:text-slate-300">
            Tickets
            <span className="ml-2 text-xs font-normal dark:text-slate-400">
              Per hour
            </span>
          </CardTitle>

          {/* 2. Legend Section (Moved here) */}
          <div className="flex items-center gap-3">
            {/* Legend Item 1 */}
            <div className="flex items-center text-xs text-slate-400">
              <div className="h-2 w-2 rounded-full bg-sky-500 mr-1.5"></div>
              Created
            </div>

            {/* Legend Item 2 */}
            <div className="flex items-center text-xs text-slate-400">
              <div className="h-2 w-2 rounded-full bg-yellow-500 mr-1.5"></div>
              Solved
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {" "}
          {/* Removed -m-2 to give axes room */}
          {/* 1. Increased height so axes and bars are visible */}
          <div className="h-[80px] w-full -mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.hourlyTrend} className="-ml-4">
                {/* 2. X-Axis: Replace "hour" with the actual key in your data (e.g. "time", "label") */}
                <XAxis
                  dataKey="time_bucket"
                  tick={{ fontSize: 12, fill: "#94a3b8" }} // slate-400
                  tickLine={false}
                  axisLine={false}
                  dy={10} // Push labels down slightly
                />

                {/* 3. Y-Axis */}
                <YAxis
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  dx={-10} // Push labels left slightly
                />

                {/* 4. Tooltip with custom dark/light mode styling */}
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--chart-tooltip)",
                    border: "var(--chart-tooltip-border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: "var(--chart-tooltip-text)" }}
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                />

                <Bar
                  dataKey="created"
                  fill="#0ea5e9"
                  radius={[4, 4, 0, 0]} // Rounded tops
                  barSize={4} // Optional: fix bar width
                />
                <Bar
                  dataKey="solved"
                  fill="#eab308"
                  radius={[4, 4, 0, 0]}
                  barSize={4}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 col-span-1 lg:col-span-6 2xl:col-span-12">
        <MetricCard
          title="Created today"
          value={summary ? summary.totalCreated.toLocaleString() : "..."}
          trend={{
            value: Math.abs(trendDiff).toString(),
            direction: trendDirection,
          }}
          subtitle="vs last day"
          className="col-span-1"
        />
        <MetricCard
          title="Open tickets"
          value={summary ? summary.totalOpen.toLocaleString() : "..."}
          className="col-span-1"
        />
        <MetricCard
          title="Unassigned"
          value="..."
          icon={<AlertCircle className="h-6 w-6 text-red-500" />}
          className="col-span-1 bg-red-100/50 border-red-200  dark:bg-red-900/20 dark:border-red-900/50"
        />
        <CsatMetricCard
          title="CSAT"
          value={(summary?.csatScore?.scorecsat ?? 0).toFixed(2)}
          showChart={true}
          chartColor="#10b981" // emerald-500
          trend={{ value: "12%", direction: "up" }}
          className="col-span-1"
        />
      </div>
    </div>
  );
}
