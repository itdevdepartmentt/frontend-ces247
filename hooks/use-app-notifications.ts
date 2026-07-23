import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface AppNotification {
  id: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export function useAppNotifications() {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["app-notifications"],
    queryFn: async () => {
      const { data } = await api.get<AppNotification[]>("/notifications");
      return data;
    },
    staleTime: 10_000,
    refetchInterval: 10_000,
  });

  const unreadQuery = useQuery({
    queryKey: ["app-notifications-unread"],
    queryFn: async () => {
      const { data } = await api.get<number>("/notifications/unread-count");
      return data;
    },
    staleTime: 10_000,
    refetchInterval: 10_000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["app-notifications-unread"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch("/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["app-notifications-unread"] });
    },
  });

  return {
    notifications: listQuery.data || [],
    isLoading: listQuery.isLoading,
    unreadCount: unreadQuery.data || 0,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
  };
}
