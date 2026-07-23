"use client";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

export interface NotificationSummary {
  pendingRekon: number;
  pendingKomitmen: number;
  total: number;
}

export function useNotifications() {
  const { user } = useAuth();

  const { data } = useQuery<NotificationSummary>({
    queryKey: ["notifications-summary", user?.id],
    queryFn: async () => {
      const res = await api.get("/qa/reconciliation/notifications/summary");
      return res.data;
    },
    enabled: !!user && ["QC", "TL", "TL_QC", "ADMIN"].includes(user.role),
    refetchInterval: 60_000, // Poll every 60 seconds
    staleTime: 30_000,
  });

  return {
    pendingRekon: data?.pendingRekon ?? 0,
    pendingKomitmen: data?.pendingKomitmen ?? 0,
    total: data?.total ?? 0,
  };
}
