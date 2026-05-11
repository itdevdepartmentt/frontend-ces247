"use client";

import { TopRow } from "@/components/dashboard/top-row";
import { LeftColumn } from "@/components/dashboard/left-column";
import { ChannelColumn } from "@/components/dashboard/channel-column";
import {
  Mail,
  MessageCircle,
  Instagram,
  MessageSquare,
  Phone,
  Globe,
  Loader2,
  DatabaseZap,
  RefreshCw,
} from "lucide-react";
import { CalendarDateRangePicker } from "@/components/dashboard/date-range-picker";
import { addDays, startOfDay } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { DateRange } from "react-day-picker";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { ChannelData } from "@/types/dashboard"; // Ensure this is imported
import IncidentWidget from "@/components/dashboard/incident-card";
import { normalizeDateRange } from "@/lib/utils";
import { fromZonedTime } from "date-fns-tz";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";

// Helper to map backend string to Icon
const getChannelIcon = (channelName: string) => {
  const normalized = channelName.toLowerCase();
  if (normalized.includes("email")) return <Mail className="text-red-500" />;
  if (normalized.includes("whatsapp"))
    return <MessageCircle className="text-green-500" />;
  if (normalized.includes("social"))
    return <Instagram className="text-pink-500" />;
  if (normalized.includes("chat"))
    return <MessageSquare className="text-orange-500" />;
  if (normalized.includes("call") || normalized.includes("188"))
    return <Phone className="text-blue-500" />;
  return <Globe className="text-slate-500" />;
};

interface DashboardPageContentProps {
  title?: string;
  isFcr?: boolean;
  showIncidentWidget?: boolean;
}

export function DashboardPageContent({
  title = "Dashboard",
  isFcr,
  showIncidentWidget = true,
}: DashboardPageContentProps) {
  const [syncingTickets, setSyncingTickets] = useState(false); // For the Daily Ticket sync
  const [syncingJobId, setSyncingJobId] = useState<string | null>(null);
  const [isJobProcessing, setIsJobProcessing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [lastSyncDate, setLastSyncDate] = useState<string | undefined>("");
  const lastSyncRef = useRef<string | null>(null);

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

  const { summary, channels, lastSync, isLoading, refetch } = useDashboardData({
    dateRange: normalizedDateRange,
    isFcr,
  });

  // 1. Polling Effect: Runs only when we have a jobId to track
  useEffect(() => {
    if (!syncingJobId) return;

    const checkStatus = async () => {
      try {
        const { data } = await api.get(`schedule/status/${syncingJobId}`);

        if (data.status === "completed") {
          await refetch();
          toast.success("Sync Complete", {
            description: "Dashboard data updated.",
            className: "text-black",
          });
          if (lastSyncRef.current) {
            setLastSyncDate(lastSyncRef.current);
          }
          setSyncingJobId(null);
          setIsJobProcessing(false);
          // Optional: trigger a data refresh for the dashboard charts
        } else if (data.status === "failed") {
          toast.error("Sync Failed", { description: data.error });
          setSyncingJobId(null);
          setIsJobProcessing(false);
        }
      } catch (err) {
        console.error("Status check failed", err);
      }
    };

    const interval = setInterval(checkStatus, 1000); // Poll every 1 seconds
    return () => clearInterval(interval);
  }, [syncingJobId, refetch]);

  // 2. Updated Trigger Function
  const handleSyncDailyOca = async () => {
    setIsJobProcessing(true);
    try {
      const response = await api.post("schedule/sync-daily-oca");

      if (response.data.jobId) {
        setSyncingJobId(response.data.jobId);
        toast("Sync Started", {
          description: "Fetching latest batches...",
        });
        lastSyncRef.current = response.data.lastSync;
      } else {
        // Fallback if no jobId returned
        toast.success(response.data.message);
        setIsJobProcessing(false);
      }
    } catch (error: any) {
      toast.error("Failed to trigger daily sync");
      setIsJobProcessing(false);
    }
  };

  useEffect(() => {
    if (lastSync) setLastSyncDate(lastSync.lastSyncWib);
  }, [lastSync]);

  // CONFIG: Define the specific order and matching logic
  const orderedLayout = [
    {
      label: "Email",
      matcher: (s: string) => s.includes("email"),
    },
    {
      label: "Whatsapp",
      matcher: (s: string) => s.includes("whatsapp") || s.includes("Whatsapp"),
    },
    {
      label: "Social Media",
      matcher: (s: string) =>
        s.includes("Socmed") || s.includes("socmed") || s.includes("SOCMED"),
    },
    {
      label: "Live Chat",
      matcher: (s: string) => s.includes("chat") || s.includes("live"),
    },
    {
      label: "Call Center 188",
      matcher: (s: string) => s.includes("call") || s.includes("188"),
    },
  ];

  // LOGIC: Merge API data into the fixed layout
  // We explicitly type 'processedChannels' to ensure TS is happy
  const processedChannels = orderedLayout.map((layout) => {
    // 1. Try to find the matching channel in the API response
    const foundData = channels?.find((c) =>
      layout.matcher(c.channel.toLowerCase()),
    );

    // 2. If found, return it. If NOT found, return a "Ghost" object with 0 values.
    if (foundData) {
      return { ...foundData, channel: layout.label }; // Ensure label matches our desired display name
    }

    return {
      channel: layout.label,
      pctSla: "0",
      open: 0,
      closed: 0,
      topCorporate: [],
      topKip: [],
    } as unknown as ChannelData; // Cast to satisfy Type requirements
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 mt-12 md:mt-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0 mb-6">
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        <div className="flex flex-col w-full sm:w-auto space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-2">
          <div className="flex items-center space-x-2">
            {/* ACTION 1: DAILY TICKET SYNC (THE NEW BUTTON) */}
            <div className="text-sm w-full">
              <Button
                variant="outline"
                className={`transition-all font-light hover:text-inherit cursor-default`}
              >
                Last Sync: {lastSyncDate}
              </Button>
            </div>

            <div className="flex flex-col gap-1">
              {/* ACTION BUTTON */}
              <Button
                onClick={handleSyncDailyOca}
                disabled={isJobProcessing}
                variant="outline"
                className={` transition-all ${
                  isJobProcessing ? "border-blue-500/50 bg-blue-500/10" : ""
                }`}
              >
                {isJobProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                ) : (
                  <RefreshCw className="h-4 w-4 text-blue-500" />
                )}
                {/* Optional text for better UX on desktop */}
                <span className="ml-2 hidden lg:inline font-light">
                  {isJobProcessing ? "Syncing..." : "Sync Today"}
                </span>
              </Button>
            </div>
          </div>
          <CalendarDateRangePicker
            className="w-full sm:w-auto"
            date={dateRange}
            setDate={setDateRange}
          />
        </div>
      </div>

      <TopRow summary={summary} />

      <div className="lg:grid lg:grid-cols-4 2xl:grid-cols-8 gap-4">
        <LeftColumn summary={summary} dateRange={normalizedDateRange} />

        {/* Change col-span based on your layout needs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 lg:col-span-3 2xl:col-span-7 gap-2">
          {processedChannels.map((channel, index) => (
            <ChannelColumn
              key={index}
              icon={getChannelIcon(channel.channel)}
              title={channel.channel}
              sla={`${channel.pctSla}%`}
              open={channel.open}
              closed={channel.closed}
              topCorporateData={channel.topCorporate}
              topKipData={channel.topKip}
              isLoading={isLoading}
            />
          ))}
        </div>
      </div>

      {showIncidentWidget && <IncidentWidget />}
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardPageContent />;
}
