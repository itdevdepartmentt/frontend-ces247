"use client";

import { useMemo, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDateRangePicker } from "@/components/dashboard/date-range-picker";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { DateRange } from "react-day-picker";
import { addDays, format, startOfDay } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

interface DownloadTrack {
  id: string;
  label: string;
  status: "idle" | "downloading" | "completed" | "failed";
  filename?: string;
}

const DOWNLOAD_TYPES = [
  { id: "omnix", label: "Raw Omnix", endpoint: "/raw-download/omnix" },
  { id: "oca", label: "Raw OCA", endpoint: "/raw-download/oca" },
  { id: "call", label: "Raw Call", endpoint: "/raw-download/call" },
  { id: "news-log", label: "News Log (CRUD)", endpoint: "/raw-download/news-log" },
];

export default function DownloadPage() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [history, setHistory] = useState<DownloadTrack[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const normalizedDateRange = useMemo(() => {
    if (!dateRange?.from) return undefined;

    const tz = "Asia/Jakarta";

    const fromLocal = startOfDay(dateRange.from);
    const toLocal = dateRange.to
      ? addDays(startOfDay(dateRange.to), 1)
      : addDays(fromLocal, 1);

    return {
      from: fromZonedTime(fromLocal, tz).toISOString(),
      to: fromZonedTime(toLocal, tz).toISOString(),
    };
  }, [dateRange]);

  const updateHistory = (item: DownloadTrack) => {
    setHistory((prev) => [item, ...prev.filter((row) => row.id !== item.id)].slice(0, 10));
  };

  const getFilenameFromDisposition = (contentDisposition?: string): string | undefined => {
    if (!contentDisposition) return undefined;
    // Try filename* (RFC 5987 encoded) first, then filename with/without quotes
    const encodedMatch = contentDisposition.match(/filename\*=(?:UTF-8'')?([^\s;]+)/i);
    if (encodedMatch) return decodeURIComponent(encodedMatch[1]);
    const fileNameMatch = contentDisposition.match(/filename="([^"]+)"/i) || contentDisposition.match(/filename=([^\s;]+)/i);
    return fileNameMatch?.[1];
  };

  const triggerDownload = async (item: (typeof DOWNLOAD_TYPES)[0]) => {
    setDownloading(item.id);
    updateHistory({ id: item.id, label: item.label, status: "downloading" });

    try {
      const params: { startDate?: string; endDate?: string } = {};

      if (normalizedDateRange?.from) {
        params.startDate = normalizedDateRange.from;
        params.endDate = normalizedDateRange.to ?? normalizedDateRange.from;
      }

      const response = await api.get(item.endpoint, {
        responseType: "blob",
        params,
      });
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const jakartaOffset = 7 * 60;
      const localDate = new Date(now.getTime() + jakartaOffset * 60 * 1000);
      const ts = `${localDate.getUTCFullYear()}-${pad(localDate.getUTCMonth() + 1)}-${pad(localDate.getUTCDate())}-${pad(localDate.getUTCHours())}-${pad(localDate.getUTCMinutes())}-${pad(localDate.getUTCSeconds())}`;
      const filename =
        getFilenameFromDisposition(response.headers["content-disposition"]) ||
        `raw-${item.id}-${ts}.xlsx`;

      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      updateHistory({
        id: item.id,
        label: item.label,
        status: "completed",
        filename,
      });
      toast.success(`${item.label} downloaded successfully`);
    } catch (error: any) {
      updateHistory({ id: item.id, label: item.label, status: "failed" });
      toast.error(error.response?.data?.message || `Failed to download ${item.label}`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="min-h-screen w-full dark:bg-slate-950 mt-12 lg:mt-0 p-6 dark:text-slate-200">
      <div className="mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Raw Data Download</h2>
          <p className="dark:text-slate-400 mt-2">
            Download RawOmnix, RawOca, and RawCall data in Excel format.
          </p>
        </div>

        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Date Filter (Optional)</CardTitle>
            <CardDescription className="dark:text-slate-400">
              Select a date range to download only records in that period.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3">
            <CalendarDateRangePicker date={dateRange} setDate={setDateRange} className="w-full sm:w-auto" />
            <Button
              variant="outline"
              className="sm:w-auto"
              onClick={() => setDateRange(undefined)}
              disabled={!dateRange?.from}
            >
              Clear Date
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DOWNLOAD_TYPES.map((item) => (
            <Card
              key={item.id}
              className="dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700 transition-colors"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-semibold">{item.label}</CardTitle>
                  <CardDescription className="dark:text-slate-400">File format: .xlsx</CardDescription>
                </div>
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <FileSpreadsheet className="h-6 w-6 text-green-500" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <Button
                  variant="secondary"
                  className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 dark:border-slate-700"
                  disabled={downloading !== null}
                  onClick={() => triggerDownload(item)}
                >
                  {downloading === item.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download File
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
          <CardHeader className="border-b dark:border-slate-800 dark:bg-slate-900/50">
            <CardTitle className="text-lg">Download Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {history.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No downloads in this session.</div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                  >
                    <div>
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className="text-xs dark:text-slate-500">
                        {item.filename || "-"}
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        item.status === "downloading"
                          ? "bg-blue-500/10 text-blue-400"
                          : item.status === "completed"
                            ? "bg-green-500/10 text-green-400"
                            : item.status === "failed"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-slate-500/10 text-slate-400"
                      }
                    >
                      {item.status.toUpperCase()}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
