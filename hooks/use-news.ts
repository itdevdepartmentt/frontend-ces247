// hooks/useNews.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "./use-auth";

export interface NewsArticle {
  id: string;
  title: string;
  content: any; // TipTap JSON
  summary: string;
  authorName: string;
  category?: string;
  status?: string;
  viewCount?: number;
  createdAt: string;
  updatedAt: string;
}
// hooks/useNews.ts
export function useNews(
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
  },
  id?: string,
) {
  const queryClient = useQueryClient();

  // 1. Fetch List
  const listQuery = useQuery({
    queryKey: ["news", params],
    queryFn: async () => {
      const { data } = await api.get<{
        data: NewsArticle[];
        meta: { total: number; lastPage: number; page: number };
      }>("/news", { params });
      return data;
    },
    // Data list dianggap fresh selama 30 detik
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  // 2. Fetch Single (for editing)
  const detailQuery = useQuery({
    queryKey: ["news", id],
    queryFn: async () => {
      const { data } = await api.get<NewsArticle>(`/news/${id}`);
      return data;
    },
    enabled: !!id, // Only run if an ID is provided
    // Detail artikel fresh selama 2 menit
    // Detail artikel fresh selama 2 menit
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });

  // Bookmark Status
  const { user } = useAuth(false);
  
  const bookmarkQuery = useQuery({
    queryKey: ["bookmark", id, user?.id],
    queryFn: async () => {
      const { data } = await api.get<{ isBookmarked: boolean }>(`/news/${id}/bookmark/status`);
      return data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Partial<NewsArticle>) => {
      const { data } = await api.post<NewsArticle>("/news", payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["news"] }),
  });

  // 3. Update Logic
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...payload }: Partial<NewsArticle>) => {
      const { data } = await api.patch<NewsArticle>(`/news/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news"] });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post<{ url: string; name: string; extractedText?: string }>(
        "/news/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return data;
    },
  });

  // 4. Delete (moved outside return to avoid creating new hook on every render)
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/news/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["news"] }),
  });

  const toggleBookmarkMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("No news ID");
      const { data } = await api.post<{ isBookmarked: boolean }>(`/news/${id}/bookmark`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["bookmark", id, user?.id], data);
      queryClient.invalidateQueries({ queryKey: ["bookmark", id] }); // invalidate old key just in case
      queryClient.invalidateQueries({ queryKey: ["myActivity"] });
    },
  });

  return {
    news: listQuery.data?.data ?? [],
    meta: listQuery.data?.meta,
    article: detailQuery.data,
    isLoading: id ? detailQuery.isLoading : listQuery.isLoading,
    createNews: createMutation.mutateAsync,
    updateNews: updateMutation.mutateAsync,
    uploadFile: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    deleteNews: deleteMutation.mutateAsync,
    isBookmarked: bookmarkQuery.data?.isBookmarked ?? false,
    toggleBookmark: toggleBookmarkMutation.mutateAsync,
    isTogglingBookmark: toggleBookmarkMutation.isPending,
  };
}
