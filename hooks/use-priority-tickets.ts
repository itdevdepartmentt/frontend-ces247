"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { PriorityTicketResponse, PriorityType } from "@/types/dashboard";

interface UsePriorityTicketsParams {
  type: PriorityType | null;
  dateRange?: { from?: string; to?: string };
  isFcr?: boolean;
  fcrType?: 'kip' | 'realisasi';
  page?: number;
  limit?: number;
  search?: string;
}

export function usePriorityTickets({
  type,
  dateRange,
  isFcr,
  fcrType,
  page = 1,
  limit = 10,
  search,
}: UsePriorityTicketsParams) {
  return useQuery({
    queryKey: ["priority-tickets", type, dateRange, page, search, isFcr, fcrType],
    queryFn: async () => {
      const { data } = await api.get<PriorityTicketResponse>(
        "/dashboard/priority-tickets",
        {
          params: {
            type,
            isFcr,
            fcrType,
            startDate: dateRange?.from,
            endDate: dateRange?.to,
            page,
            limit,
            search: search || undefined,
          },
        },
      );
      return data;
    },
    enabled: !!type && !!dateRange?.from && !!dateRange?.to,
  });
}
