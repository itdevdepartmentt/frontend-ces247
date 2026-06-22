"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api"; // Adjust path to your api.ts
import {
  FileUp,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  FileText,
  XCircle,
  Clock,
  CalendarIcon,
  RefreshCw,
  Download,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; // Or your preferred toast library
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, addDays, startOfDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { CalendarDateRangePicker } from "@/components/dashboard/date-range-picker";

interface JobTrack {
  jobId: string;
  filename: string;
  reportType: string;
  status: "active" | "completed" | "failed";
  progress?: number;
  result?: any;
  error?: string;
}

const REPORT_TYPES = [
  {
    id: "csat",
    label: "CSAT Report",
    endpoint: "/upload/csat-report",
    accept: ".xlsx",
  },
  {
    id: "omnix",
    label: "Omnix Report",
    endpoint: "/upload/omnix-report",
    accept: ".xlsx",
  },
  {
    id: "call",
    label: "Call Report",
    endpoint: "/upload/call-report",
    accept: ".xlsx",
  },
  {
    id: "oca",
    label: "OCA Report",
    endpoint: "/upload/oca-report",
    accept: ".csv",
  },
];

export default function UploadPage() {
  const [uploading, setUploading] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [activeJobs, setActiveJobs] = useState<JobTrack[]>([]);

  // Date states for Manual Sync
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -1),
    to: addDays(new Date(), -1),
  });

  // 1. Polling Logic: Check status of 'active' jobs every 3 seconds
  useEffect(() => {
    const activeIds = activeJobs.filter((j) => j.status === "active");
    if (activeIds.length === 0) return;

    const interval = setInterval(() => {
      activeIds.forEach(async (job) => {
        try {
          const { data } = await api.get(`upload/status/${job.jobId}`);

          if (data.status !== "active") {
            updateJobStatus(job.jobId, data.status, data.result || data.error);
            if (data.status === "completed")
              toast.success(`${job.filename} processed successfully`);
            if (data.status === "failed")
              toast.error(`${job.filename} processing failed`);
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [activeJobs]);

  const updateJobStatus = (
    jobId: string,
    status: JobTrack["status"],
    extra: any,
  ) => {
    setActiveJobs((prev) =>
      prev.map((j) =>
        j.jobId === jobId
          ? {
              ...j,
              status,
              [status === "completed" ? "result" : "error"]: extra,
            }
          : j,
      ),
    );
  };

  // 2. Manual Sync API Call
  const handleManualSync = async () => {
    setSyncing(true);
    const payload = {
      startDate: format(dateRange?.from ?? "", "yyyy-MM-dd"),
      endDate: format(dateRange?.to ?? "", "yyyy-MM-dd"),
    };

    try {
      const response = await api.post("schedule/trigger-oca-sync", payload);

      const newJob: JobTrack = {
        jobId: response?.data.jobId,
        filename: `OCA Sync (${payload.startDate})`,
        reportType: "API Sync",
        status: "active",
      };

      setActiveJobs((prev) => [newJob, ...prev]);
      toast.success("OCA Sync triggered successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Manual sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: (typeof REPORT_TYPES)[0],
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const expectedExtension = type.accept.replace(".", "");

    if (fileExtension !== expectedExtension) {
      toast.error(`Invalid format. Please upload a ${type.accept} file.`);
      event.target.value = ""; // Reset input
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(type.id);

    try {
      const response = await api.post(type.endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Add to our local tracking list
      const newJob: JobTrack = {
        jobId: response?.data.jobId,
        filename: file.name,
        reportType: type.label,
        status: "active",
      };
      setActiveJobs((prev) => [newJob, ...prev]);
      toast.info("Upload finished. Processing started...");
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to upload file.");
    } finally {
      setUploading(null);
      event.target.value = ""; // Reset input
    }
  };

  return (
    <div className="min-h-screen w-full dark:bg-slate-950 mt-12 lg:mt-0 p-6 dark:text-slate-200">
      <div className="mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Report Management
            </h2>
            <p className="dark:text-slate-400 mt-2">
              Upload and process system reports to the processing queue.
            </p>
          </div>
          <Button
            asChild
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium shadow-md transition-all duration-300 hover:-translate-y-0.5 shrink-0 self-start sm:self-center"
          >
            <a
              href="https://drive.google.com/drive/folders/1aLST1pakPfiGUQ_Pww5I7CQiNw1bMCDv"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              <span>Download Template Upload</span>
            </a>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {REPORT_TYPES.map((report) => (
            <Card
              key={report.id}
              className="dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700 transition-colors"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-semibold">
                    {report.label}
                  </CardTitle>
                  <CardDescription className="dark:text-slate-400">
                    Expected format:{" "}
                    <span className="text-blue-400 font-mono">
                      {report.accept}
                    </span>
                  </CardDescription>
                </div>
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  {report.accept === ".csv" ? (
                    <FileText className="h-6 w-6 text-orange-500" />
                  ) : (
                    <FileSpreadsheet className="h-6 w-6 text-green-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="relative">
                  <input
                    type="file"
                    accept={report.accept}
                    className="hidden"
                    id={`file-${report.id}`}
                    onChange={(e) => handleFileUpload(e, report)}
                    disabled={uploading !== null}
                  />
                  <label htmlFor={`file-${report.id}`}>
                    <Button
                      asChild
                      variant="secondary"
                      className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 cursor-pointer dark:border-slate-700"
                      disabled={uploading !== null}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {uploading === report.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <FileUp className="h-4 w-4" />
                            Choose File
                          </>
                        )}
                      </div>
                    </Button>
                  </label>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Job Status Table */}
        <Card className="dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
          <CardHeader className="border-b dark:border-slate-800 dark:bg-slate-900/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-400" />
              Processing Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {activeJobs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No recent uploads in this session.
                </div>
              ) : (
                activeJobs.map((job) => (
                  <div
                    key={job.jobId}
                    className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-slate-100 dark:bg-slate-950 rounded-md">
                        {job.status === "active" && (
                          <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                        )}
                        {job.status === "completed" && (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                        {job.status === "failed" && (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          {job.filename}
                        </div>
                        <div className="text-xs dark:text-slate-500">
                          {job.reportType} • ID: {job.jobId.slice(0, 8)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant="secondary"
                        className={
                          job.status === "active"
                            ? "bg-blue-500/10 text-blue-400"
                            : job.status === "completed"
                              ? "bg-green-500/10 text-green-400"
                              : "bg-red-500/10 text-red-400"
                        }
                      >
                        {job.status.toUpperCase()}
                      </Badge>
                      {/* {job.result && (
                        <span className="text-[10px] text-slate-400">
                          Inserted: {job.result.stats?.inserted || 0}
                        </span>
                      )} */}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-4">
        {/* Manual Sync Control */}
        <Card className="dark:bg-slate-900 dark:border-slate-800 p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold dark:text-slate-500 mb-1 ml-1">
              OCA Manual Report Sync Period
            </span>
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <CalendarDateRangePicker
                date={dateRange}
                setDate={setDateRange}
              />
              <Button
                onClick={handleManualSync}
                disabled={syncing || !dateRange?.from}
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                {syncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Trigger Sync
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
