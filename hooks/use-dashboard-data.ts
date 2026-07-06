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
  fcrType?: 'kip' | 'realisasi';
  categories?: string[];
  subCategories?: string[];
  detailCategories?: string[];
}

export function useDashboardData({ dateRange, isFcr, fcrType, categories, subCategories, detailCategories }: UseDashboardProps) {
  // Helper to format dates for API (assuming API takes YYYY-MM-DD)
  const queryParams = {
    startDate: dateRange?.from ? dateRange.from : undefined,
    endDate: dateRange?.to ? dateRange.to : undefined,
    isFcr,
    fcrType,
    categories: categories?.length ? categories.join(',') : undefined,
    subCategories: subCategories?.length ? subCategories.join(',') : undefined,
    detailCategories: detailCategories?.length ? detailCategories.join(',') : undefined,
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
  });

  const filterOptionsQuery = useQuery({
    queryKey: ["dashboard", "filter-options"],
    queryFn: async () => {
      const { data } = await api.get<{
        categories: string[];
        subCategories: string[];
        detailCategories: string[];
      }>("/dashboard/filter-options");
      return data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes since these rarely change
  });

  return {
    summary: summaryQuery.data,
    channels: channelsQuery.data,
    lastSync: lastSync.data,
    filterOptions: filterOptionsQuery.data,
    isLoading: summaryQuery.isLoading || channelsQuery.isLoading,
    isFilterLoading: filterOptionsQuery.isLoading,
    isError: summaryQuery.isError || channelsQuery.isError,
    refetch: () => {
      summaryQuery.refetch();
      channelsQuery.refetch();
      lastSync.refetch();
    },
  };
}
