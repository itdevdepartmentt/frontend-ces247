// hooks/useNews.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface NewsArticle {
  id: string;
  title: string;
  content: any; // TipTap JSON
  summary: string;
  authorName: string;
  category?: string;
  status?: string;
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
  });

  // 2. Fetch Single (for editing)
  const detailQuery = useQuery({
    queryKey: ["news", id],
    queryFn: async () => {
      const { data } = await api.get<NewsArticle>(`/news/${id}`);
      return data;
    },
    enabled: !!id, // Only run if an ID is provided
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

  return {
    news: listQuery.data?.data ?? [],
    meta: listQuery.data?.meta,
    article: detailQuery.data,
    isLoading: listQuery.isLoading,
    createNews: createMutation.mutateAsync,
    updateNews: updateMutation.mutateAsync,
    uploadFile: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    deleteNews: useMutation({
      mutationFn: (id: string) => api.delete(`/news/${id}`),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["news"] }),
    }).mutateAsync,
  };
}
