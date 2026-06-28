import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface Comment {
  id: string;
  content: string;
  newsId: string;
  userId: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "USER" | "ADMIN";
  };
  replies?: Comment[];
  likes?: { userId: string }[];
  _count?: { likes: number };
}

interface CommentListResponse {
  data: Comment[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
  };
}

export function useComments(newsId: string, page = 1, limit = 20) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["comments", newsId, page],
    queryFn: async () => {
      const { data } = await api.get<CommentListResponse>(
        `/news/${newsId}/comments`,
        { params: { page, limit } }
      );
      return data;
    },
    enabled: !!newsId,
    staleTime: 15_000,
  });

  const createMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string }) => {
      const { data } = await api.post<Comment>(
        `/news/${newsId}/comments`,
        { content, parentId }
      );
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["comments", newsId] });
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { data } = await api.post<{ liked: boolean }>(
        `/news/${newsId}/comments/${commentId}/like`
      );
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["comments", newsId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/news/${newsId}/comments/${commentId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["comments", newsId] });
    },
  });

  return {
    comments: listQuery.data?.data ?? [],
    meta: listQuery.data?.meta,
    isLoading: listQuery.isLoading,
    createComment: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    toggleLike: toggleLikeMutation.mutateAsync,
    isLiking: toggleLikeMutation.isPending,
    deleteComment: deleteMutation.mutateAsync,
  };
}
