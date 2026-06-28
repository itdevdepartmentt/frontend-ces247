import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface Activity {
  id: string;
  type: string;
  newsId: string;
  actorId: string;
  recipientId: string;
  commentId: string | null;
  isRead: boolean;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    email: string;
  };
  news: {
    id: string;
    title: string;
  };
  comment: {
    id: string;
    content: string;
  } | null;
}

interface ActivityListResponse {
  data: Activity[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
  };
}

export function useActivity(page = 1, limit = 20) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["activity", page],
    queryFn: async () => {
      const { data } = await api.get<ActivityListResponse>(
        "/news/activity",
        { params: { page, limit } }
      );
      return data;
    },
    staleTime: 10_000,
    refetchInterval: 10_000,
  });

  const unreadQuery = useQuery({
    queryKey: ["activity-unread"],
    queryFn: async () => {
      const { data } = await api.get<{ count: number }>(
        "/news/activity/unread-count"
      );
      return data;
    },
    refetchInterval: 10_000,
    staleTime: 10_000,
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch("/news/activity/read");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["activity"] });
      await queryClient.invalidateQueries({ queryKey: ["activity-unread"] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (activityId: string) => {
      await api.patch(`/news/activity/${activityId}/read`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["activity"] });
      await queryClient.invalidateQueries({ queryKey: ["activity-unread"] });
    },
  });

  return {
    activities: listQuery.data?.data ?? [],
    meta: listQuery.data?.meta,
    isLoading: listQuery.isLoading,
    unreadCount: unreadQuery.data?.count ?? 0,
    markAllAsRead: markAllReadMutation.mutateAsync,
    markAsRead: markReadMutation.mutateAsync,
  };
}
