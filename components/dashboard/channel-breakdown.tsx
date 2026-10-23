import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { keteranganJadwal } from "@/lib/channel-schedule";
import { DataTable } from "./data-table";
import { TopItem } from "@/types/dashboard";
import { Lightbulb, Network } from "lucide-react";

interface ChannelColumnProps {
  icon: React.ReactNode;
  title: string;
  sla: string;
  open: number;
  closed: number;
  connOpen: number;
  solOpen: number;
  connOver3h: number;
  solOver6h: number;
  connOpenOver3h: number;
  solOpenOver6h: number;
  connOpenNear3h: number;
  solOpenNear6h: number;
  pctFcr: string;
  pctNonFcr: string;
  pctPareto: string;
  pctNotPareto: string;
}

// Columns definition for the DataTable
const columns = [
  { key: "name", label: "Nama Perusahaan" },
  { key: "total", label: "Interaksi" },
  { key: "ticket", label: "Tiket" },
  { key: "pctFcr", label: "%FCR" },
  // API didn't return FCR per corporate, so we remove that column for now
];

const corporateColumns = [
  { key: "name", label: "Nama Perusahaan" },
  { key: "tickets", label: "Tiket" },
  { key: "fcr", label: "%FCR" },
];

const kipColumns = [
  { key: "category", label: "Detail Kategori" },
  { key: "tickets", label: "Tiket" },
  { key: "fcr", label: "%FCR" },
];

export function ChannelBreakdown({
  icon,
  title,
  sla,
  open,
  closed,
  connOpen,
  solOpen,
  connOver3h,
  solOver6h,
  connOpenOver3h,
  solOpenOver6h,
  connOpenNear3h,
  solOpenNear6h,
  pctFcr,
  pctNonFcr,
  pctPareto,
  pctNotPareto,
}: ChannelColumnProps) {
  const jadwal = keteranganJadwal(title);

  return (
    <div className="flex flex-col">
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardHeader className="flex flex-row items-center space-y-0 pb-0 -mt-2">
          {icon}
          <div className="ml-2 flex min-w-0 flex-col gap-1">
            <CardTitle className="text-md font-bold leading-none">
              {title}
            </CardTitle>
            {jadwal && (
              <span className="text-[9px] font-semibold leading-none tracking-tight text-slate-400 dark:text-slate-500">
                {jadwal}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="text-center px-4 pt-0 -mt-2 -mb-2">
          <div className="flex justify-between pb-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                SLA
              </p>
              <div className="bg-green-100 text-green-700 border-green-500 dark:bg-green-900/50 dark:text-green-500 font-bold rounded-full w-16 h-8 flex items-center justify-center text-sm border-2 border-green-500">
                {sla}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Open
              </p>
              <div className="bg-red-100 text-red-700 border-red-500 dark:bg-red-900/50 dark:text-red-500 font-bold rounded-full w-16 h-8 flex items-center justify-center text-sm border-2 border-red-500">
                {open}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Closed
              </p>
              <div className="bg-blue-100 text-blue-700 border-blue-500 dark:bg-blue-900/50 dark:text-blue-500 font-bold rounded-full w-16 h-8 flex items-center justify-center text-sm border-2 border-blue-500">
                {closed}
              </div>
            </div>
          </div>

          {/* Dashed Divider */}
          <div className="border-t-2 border-dashed dark:border-gray-300" />

          {/* MIDDLE ROW: Connectivity & Solution */}
          <div className="grid grid-cols-1 gap-4 pt-4">
            {/* Connectivity Column */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 dark:text-slate-400">
                <Network className="h-4 w-4 text-sky-500" />
                <span className="text-sm font-medium">Connectivity</span>
              </div>
              <div className="grid grid-cols-4 gap-2 items-end">
                <div className="flex flex-col items-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Open
                  </p>
                  <div className="bg-green-100 text-green-700 border-green-500 dark:bg-green-900/50 dark:text-green-500 font-bold rounded-md w-14 h-8 flex items-center justify-center text-sm border-2 border-green-500">
                    {connOpen}
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Open Near 3H
                  </p>
                  <div className="bg-yellow-100 text-yellow-700 border-yellow-500 dark:bg-yellow-900/50 dark:text-yellow-500 font-bold rounded-md w-14 h-8 flex items-center justify-center text-sm border-2 border-yellow-500">
                    {connOpenNear3h}
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Open Over 3H
                  </p>
                  <div className="bg-red-100 text-red-700 border-red-500 dark:bg-red-900/50 dark:text-red-500 font-bold rounded-md w-14 h-8 flex items-center justify-center text-sm border-2 border-red-500">
                    {connOpenOver3h}
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Closed 3H
                  </p>
                  <div className="bg-blue-100 text-blue-700 border-blue-500 dark:bg-blue-900/50 dark:text-blue-500 font-bold rounded-md w-14 h-8 flex items-center justify-center text-sm border-2 border-blue-500">
                    {connOver3h}
                  </div>
                </div>
              </div>
            </div>

            {/* Solution Column */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-slate-400">
                <Lightbulb className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Solution</span>
              </div>
              <div className="grid grid-cols-4 gap-2 items-end">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Open
                  </p>
                  <div className="bg-green-100 text-green-700 border-green-500 dark:bg-green-900/50 dark:text-green-500 font-bold rounded-md w-14 h-8 flex items-center justify-center text-sm border-2 border-green-500">
                    {solOpen}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Open Near 6H
                  </p>
                  <div className="bg-yellow-100 text-yellow-700 border-yellow-500 dark:bg-yellow-900/50 dark:text-yellow-500 font-bold rounded-md w-14 h-8 flex items-center justify-center text-sm border-2 border-yellow-500">
                    {solOpenNear6h}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Open Over 6H
                  </p>
                  <div className="bg-red-100 text-red-700 border-red-500 dark:bg-red-900/50 dark:text-red-500 font-bold rounded-md w-14 h-8 flex items-center justify-center text-sm border-2 border-red-500">
                    {solOpenOver6h}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Closed 6H
                  </p>
                  <div className="bg-blue-100 text-blue-700 border-blue-500 dark:bg-blue-900/50 dark:text-blue-500 font-bold rounded-md w-14 h-8 flex items-center justify-center text-sm border-2 border-blue-500">
                    {solOver6h}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dashed Divider */}
          <div className="my-4 border-t-2 border-dashed border-gray-300" />

          {/* %SLA Column */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-sm font-medium">%SLA</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <p className="text-[8pt] text-slate-400 mb-1">FCR</p>
                <div className="bg-grey-900/50 text-slate-500 font-bold rounded-md w-14 h-8 flex items-center justify-center text-xs border-2 border-grey-500">
                  {pctFcr}%
                </div>
              </div>
              <div>
                <p className="text-[8pt] text-slate-400 mb-1">Non FCR</p>
                <div className="bg-grey-900/50 text-slate-500 font-bold rounded-md w-14 h-8 flex items-center justify-center text-xs border-2 border-grey-500">
                  {pctNonFcr}%
                </div>
              </div>
              <div>
                <p className="text-[8pt] text-slate-400 mb-1">Pareto</p>
                <div className="bg-grey-900/50 text-slate-500 font-bold rounded-md w-14 h-8 flex items-center justify-center text-xs border-2 border-grey-500">
                  {pctPareto}%
                </div>
              </div>
              <div>
                <p className="text-[8pt] text-slate-400 mb-1">Non Pareto</p>
                <div className="bg-grey-900/50 text-slate-500 font-bold rounded-md w-14 h-8 flex items-center justify-center text-xs border-2 border-grey-500">
                  {pctNotPareto}%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
