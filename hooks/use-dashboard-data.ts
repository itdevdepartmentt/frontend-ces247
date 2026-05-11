"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { DashboardSummary, ChannelData } from "@/types/dashboard";

interface UseDashboardProps {
  dateRange?: {
    from?: string;
    to?: string;
  };
  isFcr?: boolean;
}

export function useDashboardData({ dateRange, isFcr }: UseDashboardProps) {
  // Helper to format dates for API (assuming API takes YYYY-MM-DD)
  const queryParams = {
    startDate: dateRange?.from ? dateRange.from : undefined,
    endDate: dateRange?.to ? dateRange.to : undefined,
    isFcr,
  };

  const summaryQuery = useQuery({
    queryKey: ["dashboard", "summary", queryParams],
    queryFn: async () => {
      const { data } = await api.get<DashboardSummary>("/dashboard/summary", {
        params: queryParams,
      });
      return data;
    },
  });

  const channelsQuery = useQuery({
    queryKey: ["dashboard", "channels", queryParams],
    queryFn: async () => {
      const { data } = await api.get<ChannelData[]>("/dashboard/channels", {
        params: queryParams,
      });
      return data;
    },
  });

  const lastSync = useQuery({
    queryKey: ["sync"],
    queryFn: async () => {
      const { data } = await api.get<{lastSyncWib: string}>("/schedule/last-sync");
      return data;
    }
  })

  return {
    summary: summaryQuery.data,
    channels: channelsQuery.data,
    lastSync: lastSync.data,
    isLoading: summaryQuery.isLoading || channelsQuery.isLoading,
    isError: summaryQuery.isError || channelsQuery.isError,
    refetch: () => {
      summaryQuery.refetch();
      channelsQuery.refetch();
      lastSync.refetch();
    },
  };
}
