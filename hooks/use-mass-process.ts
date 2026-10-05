"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Paginated } from "@/types/forms";
import type {
  MassDailyActivity,
  MassDashboard,
  MassProcessStep,
  MassTicket,
  MassTicketDetail,
  SaveRecapPayload,
} from "@/types/mass-process";

const KEY = "mass-process";

export interface TicketFilters {
  search?: string;
  agent?: string;
  overallStatus?: string;
  ageingBucket?: string;
  bottleneck?: string;
  page?: number;
  limit?: number;
}

export function useMassDashboard() {
  return useQuery<MassDashboard>({
    queryKey: [KEY, "dashboard"],
    queryFn: async () => {
      const { data } = await api.get<MassDashboard>("/mass-process/dashboard");
      return data;
    },
  });
}

export function useMassTickets(filters: TicketFilters = {}) {
  return useQuery<Paginated<MassTicket>>({
    queryKey: [KEY, "tickets", filters],
    queryFn: async () => {
      // Nilai kosong sengaja dibuang agar tidak terkirim sebagai filter "".
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== "" && v !== undefined),
      );
      const { data } = await api.get<Paginated<MassTicket>>(
        "/mass-process/tickets",
        { params },
      );
      return data;
    },
  });
}

export function useMassTicket(ticketNumber: string | undefined) {
  return useQuery<MassTicketDetail>({
    queryKey: [KEY, "ticket", ticketNumber],
    enabled: Boolean(ticketNumber),
    queryFn: async () => {
      const { data } = await api.get<MassTicketDetail>(
        `/mass-process/tickets/${encodeURIComponent(ticketNumber!)}`,
      );
      return data;
    },
  });
}

export function useProcessSteps() {
  return useQuery<MassProcessStep[]>({
    queryKey: [KEY, "process-steps"],
    queryFn: async () => {
      const { data } = await api.get<MassProcessStep[]>(
        "/mass-process/process-steps",
      );
      return data;
    },
  });
}

export function useDailyActivity(date?: string) {
  return useQuery<MassDailyActivity[]>({
    queryKey: [KEY, "daily-activity", date],
    queryFn: async () => {
      const { data } = await api.get<MassDailyActivity[]>(
        "/mass-process/daily-activity",
        { params: date ? { date } : undefined },
      );
      return data;
    },
  });
}

function useInvalidateTicket(ticketNumber?: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: [KEY, "tickets"] });
    void queryClient.invalidateQueries({ queryKey: [KEY, "dashboard"] });
    if (ticketNumber) {
      void queryClient.invalidateQueries({ queryKey: [KEY, "ticket", ticketNumber] });
    }
  };
}

export function useSaveRecap(ticketNumber: string) {
  const invalidate = useInvalidateTicket(ticketNumber);
  return useMutation({
    mutationFn: async (payload: SaveRecapPayload) => {
      const { data } = await api.patch<MassTicket>(
        `/mass-process/tickets/${encodeURIComponent(ticketNumber)}`,
        payload,
      );
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateAgent(ticketNumber: string) {
  const invalidate = useInvalidateTicket(ticketNumber);
  return useMutation({
    mutationFn: async (payload: {
      newAgent: string;
      newTeamLeader?: string;
      reason?: string;
    }) => {
      const { data } = await api.patch<MassTicket>(
        `/mass-process/tickets/${encodeURIComponent(ticketNumber)}/agent`,
        payload,
      );
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useUploadTickets() {
  const invalidate = useInvalidateTicket();
  return useMutation({
    mutationFn: async (rows: Record<string, unknown>[]) => {
      const { data } = await api.post<{
        created: number;
        updated: number;
        skipped: string[];
      }>("/mass-process/upload", { rows });
      return data;
    },
    onSuccess: invalidate,
  });
}
