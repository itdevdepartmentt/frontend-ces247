import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export type ActivityFilter = "ALL" | "BOOKMARKS" | "COMMENTS" | "LIKES";

export interface MyActivityItem {
  id: string;
  type: "COMMENT" | "REPLY" | "LIKE" | "BOOKMARK";
  newsId: string;
  newsTitle: string;
  content?: string;
  actorName?: string;
  createdAt: string;
}

interface MyActivityResponse {
  data: MyActivityItem[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
  };
}

export function useMyActivity(filter: ActivityFilter = "ALL", page = 1, limit = 20) {
  const query = useQuery({
    queryKey: ["myActivity", filter, page, limit],
    queryFn: async () => {
      const { data } = await api.get<MyActivityResponse>("/news/activity/me", {
        params: { filter, page, limit },
      });
      return data;
    },
    staleTime: 15_000,
  });

  return {
    activities: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
  };
}
